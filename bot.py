
@routes.post("/api/gift_send")
async def api_gift_send(request):
    """Отправка подарка другу через Telegram"""
    u = get_tg_user(request)
    if not u:
        return web.json_response({"error": "unauthorized"}, status=401)
    
    body = await request.json()
    item_uid = (body.get("uid") or "").strip()
    recipient_username = (body.get("recipient") or "").strip().lstrip("@")
    
    if not item_uid:
        return web.json_response({"error": "Не выбран подарок"}, status=400)
    if not recipient_username:
        return web.json_response({"error": "Не указан получатель"}, status=400)
    
    # Находим предмет в инвентаре отправителя
    user = await get_or_create_user(u["id"])
    inv = user.get("inv", [])
    idx = next((i for i, it in enumerate(inv) if it.get("uid") == item_uid), None)
    
    if idx is None:
        return web.json_response({"error": "Подарок не найден в инвентаре"}, status=404)
    
    item = inv[idx]
    gid = item.get("gid")
    g = GIFTS_CONST.get(gid)
    
    if not g:
        return web.json_response({"error": "Неизвестный предмет"}, status=400)
    
    # Получаем реальный gift_id для Telegram
    real_id = None
    async with aiosqlite.connect(DB_PATH, timeout=10) as db:
        async with db.execute("SELECT real FROM gift_map WHERE internal=?", (gid.lower(),)) as cur:
            row = await cur.fetchone()
    
    if row:
        real_id = row[0]
    else:
        # Ищем в кэше доступных подарков
        gifts = await available_gifts()
        emoji = g["emoji"]
        price_i = g["price"]
        
        for gg in gifts:
            st_em = (gg.get("sticker") or {}).get("emoji", "")
            rc = gg.get("remaining_count")
            if st_em == emoji and gg.get("star_count") == price_i and (rc is None or rc > 0):
                real_id = gg.get("id")
                break
        
        if not real_id and emoji:
            for gg in gifts:
                st_em = (gg.get("sticker") or {}).get("emoji", "")
                rc = gg.get("remaining_count")
                if st_em == emoji and (rc is None or rc > 0):
                    real_id = gg.get("id")
                    break
    
    if not real_id:
        return web.json_response({"error": "Этот подарок нельзя отправить (нет в Telegram)"}, status=400)
    
    # Резолвим username получателя в user_id
    try:
        chat = await bot.get_chat(f"@{recipient_username}")
        recipient_id = chat.id
    except Exception as e:
        logger.warning(f"get_chat error: {e}")
        return web.json_response({"error": "Пользователь не найден или недоступен"}, status=404)
    
    if recipient_id == u["id"]:
        return web.json_response({"error": "Нельзя отправить подарок самому себе"}, status=400)
    
    # Комиссия за отправку (10% от стоимости подарка)
    fee = max(1, int(g["price"] * 0.1))
    balance = int(user.get("balance", 0))
    
    if balance < fee:
        return web.json_response({"error": f"Недостаточно Stars для комиссии ⭐{fee}"}, status=402)
    
    # Списываем комиссию
    await update_user(u["id"], balance=balance - fee)
    
    # Отправляем подарок через Telegram Bot API
    send_text = f"🎁 <b>Подарок от {u.get('first_name', 'друга')}</b>\n\nВам отправили <b>{g['name']}</b> {g['emoji']} через Cash Banni!"
    
    res = await tg_call("sendGift", {
        "user_id": recipient_id,
        "gift_id": real_id,
        "text": send_text,
        "text_parse_mode": "HTML"
    })
    
    if not res.get("ok"):
        # Возвращаем комиссию при ошибке
        await update_user(u["id"], balance=balance)
        
        desc = str(res.get("description", "unknown"))
        logger.error(f"sendGift fail: {desc}")
        
        dl = desc.lower()
        if "not enough" in dl or "balance" in dl:
            return web.json_response({"error": "У бота не хватает звёзд для отправки"}, status=402)
        if "limit" in dl or "exceed" in dl:
            return web.json_response({"error": "Лимит подарков Telegram исчерпан"}, status=400)
        
        return web.json_response({"error": "Telegram: " + desc}, status=502)
    
    # Удаляем предмет из инвентаря отправителя
    inv.pop(idx)
    await update_user(u["id"], inv=inv)
    
    # Логируем отправку
    async with aiosqlite.connect(DB_PATH, timeout=10) as db:
        await db.execute(
            "INSERT INTO gift_log (from_id, to_id, gift_id, gift_name, fee, created_at) VALUES (?,?,?,?,?,?)",
            (u["id"], recipient_id, gid, g["name"], fee, now_utc().isoformat())
        )
        await db.commit()
    
    # Уведомляем получателя
    try:
        await bot.send_message(
            recipient_id,
            f"🎉 <b>Вам подарок!</b>\n\n{u.get('first_name', 'Друг')} отправил(а) вам <b>{g['name']}</b> {g['emoji']}\n\nОткройте Cash Banni, чтобы увидеть подарок в инвентаре.",
            parse_mode="HTML"
        )
    except Exception as e:
        logger.warning(f"notify recipient failed: {e}")
    
    # Уведомляем админов
    for aid in ADMIN_IDS:
        await safe_send(
            aid,
            f"🎁 <b>Подарок отправлен</b>\nОт: {u.get('first_name')} (<code>{u['id']}</code>)\nКому: <code>{recipient_id}</code>\n{g['emoji']} {g['name']}\nКомиссия: ⭐{fee}",
            parse_mode="HTML"
        )
    
    logger.info(f"🎁 Gift sent: {u['id']} -> {recipient_id} ({gid}, fee ⭐{fee})")
    
    return web.json_response({
        "ok": True,
        "fee": fee,
        "inv": inv,
        "balance": balance - fee
    })
