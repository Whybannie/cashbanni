const CASE_IMG = {
  free:'case_fri.JPG', fri:'case_fri.JPG',
  starter:'case_starter.JPG', start:'case_starter.JPG',
  mini:'case_mini.JPG',
  xaip:'case_xaip.JPG', hype:'case_xaip.JPG', haip:'case_xaip.JPG',
  premium:'case_premium.JPG', prem:'case_premium.JPG'
};
function caseArt(c){
  const col=CASE_COLORS[c.rarity];
  const src=c.img||CASE_IMG[c.id];
  const art = src
    ? '<img class="case-img" src="'+src+'" alt="'+c.name+'">'
    : '<div class="bow"></div><div class="lid"></div><div class="body"></div><div class="rv"></div><div class="rh"></div><div class="em">'+c.em+'</div>';
  return '<div class="case-art" style="--c0:'+col[0]+';--c1:'+col[1]+';--c2:'+col[2]+';--glow:'+RAR[c.rarity].glow+'">'+art+'</div>';
}
