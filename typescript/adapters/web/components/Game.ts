let start :number = 0;

export const draw = (delta :number)=>{
  if (start === undefined) start = delta;
  const elapsed = delta - start;
  

  window.requestAnimationFrame(draw);
}


window.requestAnimationFrame(draw)
