const input = document.getElementById('input');
const text = document.getElementById('text');
const speed = document.getElementById('speed');
const speedValue = document.getElementById('speedValue');
const fontSize = document.getElementById('fontSize');
const fontSizeValue = document.getElementById('fontSizeValue');
const dialogue = document.getElementById('dialogue');
const startButton = document.getElementById('start');
const finishButton = document.getElementById('finish');
const clearButton = document.getElementById('clear');
const spriteSheetButton = document.getElementById('spriteSheet');

let timer = null;
let currentIndex = 0;

function updateSpeed(){ speedValue.textContent = `${speed.value} ms`; }
function updateFontSize(){
  const size = Number(fontSize.value);
  dialogue.style.fontSize = `${size}px`;
  fontSizeValue.textContent = `${size}px`;
}
speed.addEventListener('input', updateSpeed);
fontSize.addEventListener('input', updateFontSize);
updateSpeed(); updateFontSize();

function typeText(){
  clearTimeout(timer);
  const value = input.value;
  if(!value){ text.textContent=''; currentIndex=0; return; }
  if(currentIndex >= value.length) return;
  text.textContent = value.substring(0, currentIndex + 1);
  currentIndex++;
  timer = setTimeout(typeText, Number(speed.value));
}

startButton.addEventListener('click', ()=>{
  clearTimeout(timer);
  currentIndex=0;
  text.textContent='';
  typeText();
});

finishButton.addEventListener('click', ()=>{
  clearTimeout(timer);
  text.textContent=input.value;
  currentIndex=input.value.length;
});

clearButton.addEventListener('click', ()=>{
  clearTimeout(timer);
  input.value='';
  text.textContent='';
  currentIndex=0;
});

async function waitForFont(){
  if(document.fonts && document.fonts.load){
    await document.fonts.load(`400 ${Number(fontSize.value)}px "Pretendard"`);
  }
}

const spriteExportMode = document.getElementById('spriteExportMode');
const frameSelectWrap = document.getElementById('frameSelectWrap');
const frameSelect = document.getElementById('frameSelect');

for(let i=1;i<=36;i++){
  const option=document.createElement('option');
  option.value=String(i);
  option.textContent=String(i);
  frameSelect.appendChild(option);
}

spriteExportMode.addEventListener('change', ()=>{
  frameSelectWrap.hidden = spriteExportMode.value !== 'frame';
});

async function buildTypewriterFrames(){
  const value=input.value;
  if(!value){ alert('Enter some text first.'); return null; }

  const FRAME_WIDTH=170;
  const FRAME_HEIGHT=170;
  const COLUMNS=6;
  const ROWS=6;
  const TOTAL_SLOTS=36;
  const PAD_X=8;
  const PAD_Y=8;

  if(value.length > TOTAL_SLOTS){
    alert('This format supports up to 36 characters. Shorten the text to 36 characters or fewer.');
    return null;
  }

  await waitForFont();

  const canvas=document.createElement('canvas');
  canvas.width=FRAME_WIDTH*COLUMNS;
  canvas.height=FRAME_HEIGHT*ROWS;
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#fff';
  ctx.textAlign='left';
  ctx.textBaseline='middle';

  function fitFontSize(textValue){
    let size=Number(fontSize.value)||20;
    const maxWidth=FRAME_WIDTH-PAD_X*2;
    const maxHeight=FRAME_HEIGHT-PAD_Y*2;
    while(size>8){
      ctx.font=`400 ${size}px "Pretendard", Arial, sans-serif`;
      const m=ctx.measureText(textValue);
      const h=(m.actualBoundingBoxAscent||size*0.8)+(m.actualBoundingBoxDescent||size*0.2);
      if(m.width<=maxWidth && h<=maxHeight) return size;
      size--;
    }
    return 8;
  }

  for(let i=0;i<TOTAL_SLOTS;i++){
    const shown=Math.min(i+1,value.length);
    const frameText=value.substring(0,shown);
    const col=i%COLUMNS;
    const row=Math.floor(i/COLUMNS);
    const frameX=col*FRAME_WIDTH;
    const frameY=row*FRAME_HEIGHT;

    ctx.save();
    ctx.beginPath();
    ctx.rect(frameX,frameY,FRAME_WIDTH,FRAME_HEIGHT);
    ctx.clip();
    ctx.clearRect(frameX,frameY,FRAME_WIDTH,FRAME_HEIGHT);

    const size=fitFontSize(frameText);
    ctx.font=`400 ${size}px "Pretendard", Arial, sans-serif`;
    ctx.fillText(frameText,frameX+PAD_X,frameY+FRAME_HEIGHT/2);
    ctx.restore();
  }
  return {canvas, FRAME_WIDTH, FRAME_HEIGHT, COLUMNS, ROWS};
}

function downloadCanvas(canvas, filename){
  canvas.toBlob(blob=>{
    if(!blob){ alert('Could not create PNG.'); return; }
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.href=url;
    link.download=filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  },'image/png');
}

spriteSheetButton.addEventListener('click', async ()=>{
  const result=await buildTypewriterFrames();
  if(!result) return;

  if(spriteExportMode.value === 'frame'){
    const frameNumber=Number(frameSelect.value)-1;
    const col=frameNumber%result.COLUMNS;
    const row=Math.floor(frameNumber/result.COLUMNS);
    const frame=document.createElement('canvas');
    frame.width=result.FRAME_WIDTH;
    frame.height=result.FRAME_HEIGHT;
    frame.getContext('2d').drawImage(
      result.canvas,
      col*result.FRAME_WIDTH,row*result.FRAME_HEIGHT,
      result.FRAME_WIDTH,result.FRAME_HEIGHT,
      0,0,result.FRAME_WIDTH,result.FRAME_HEIGHT
    );
    downloadCanvas(frame,`typewriter-frame-${frameNumber+1}-170x170.png`);
  } else {
    downloadCanvas(result.canvas,'typewriter-sprite-sheet-1020x1020.png');
  }
});
