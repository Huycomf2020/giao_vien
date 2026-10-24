(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.SchoolSchedule=factory();})(typeof window!=='undefined'?window:globalThis,function(){
 const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/\s+/g,' ').trim();
 function nameMatch(line,name){return !!norm(name)&&norm(line).replace(/\s/g,'').includes(norm(name).replace(/\s/g,''));}
 function weekday(line){const n=norm(line);const m=n.match(/(?:\bthu\s*|\bt)([2-7])\b/);if(m)return +m[1]-1;if(/chu nhat|\bcn\b/.test(n))return 0;const names=['chu nhat','thu hai','thu ba','thu tu','thu nam','thu sau','thu bay'];for(let i=1;i<names.length;i++)if(n.includes(names[i]))return i;return null;}
 function dateForDay(week,day){const d=new Date(week+'T12:00:00+07:00');if(!Number.isFinite(+d))return '';d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7)+(day+6)%7);return d.toISOString().slice(0,10)}
 function readDate(line,week){const m=line.match(/\b(\d{1,2})\s*[\/-]\s*(\d{1,2})(?:\s*[\/-]\s*(\d{4}))?\b/);if(!m)return '';return (m[3]||week.slice(0,4))+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0')}
 function readTime(line){const m=line.match(/\b([01]?\d|2[0-3])\s*[:hHgG]\s*([0-5]\d)?/);return m?m[1].padStart(2,'0')+':'+(m[2]||'00'):''}
 function className(line){return (line.match(/\b(?:1[0-2]|[6-9])\s*[a-zA-ZĐđ]{1,2}\s*\d{1,2}\b/)?.[0]||'').replace(/\s/g,'').toUpperCase()}
 function period(line,afternoon){const m=norm(line).match(/\btiet\s*[:.]?\s*(10|[1-9])\b/);if(!m)return null;const p=+m[1];const suffix=norm(line).match(/\btiet\s*[:.]?\s*\d+\s*([sc])\b/);const value=suffix?.[1]==='c'?p+5:suffix?.[1]==='s'?p:afternoon&&p<=5?p+5:p;return value<=8?value:null}
 function parse(text,{mode,name,week,personal=false,alias='',classHint=''}={}){const rows=[],warnings=[];let day=null,date='',pm=false;const lines=String(text).split(/\n/).map(s=>s.trim()).filter(Boolean);for(const line of lines){const n=norm(line),d=weekday(line);if(d!==null){day=d;date=dateForDay(week,d)}const explicit=readDate(line,week);if(explicit){date=explicit;const dt=new Date(date+'T12:00:00+07:00');if(Number.isFinite(+dt))day=dt.getUTCDay();}if(n.includes('buoi chieu'))pm=true;if(n.includes('buoi sang'))pm=false;
   const mine=nameMatch(line,name)||(alias&&nameMatch(line,alias));if(mode==='weekly'){if(!mine)continue;const time=readTime(line);rows.push({title:line,date:date||'',time,class:className(line),cat:/phu huynh|chu nhiem|sinh hoat lop/.test(n)?1:/day|giao an|cham bai|on thi/.test(n)?0:2});if(!date||!time)warnings.push('Có dòng thiếu ngày/giờ: hãy bổ sung trong bước kiểm tra.');}
   else if(personal||mine){const p=period(line,pm),cls=className(line)||classHint;if(p&&day!==null&&(cls||line.trim()))rows.push({day,period:p,class:cls,subject:line.replace(/\b(?:[Tt]hứ\s*[2-7]|[Tt]iết\s*\d+)\b/g,'').replace(cls,'').trim().slice(0,160),room:''});}
  }if(mode==='timetable'&&!rows.length)warnings.push('Chưa tách được bảng thành thứ/tiết/lớp. Kiểm tra chữ nhận diện; có thể chỉnh thành từng dòng như “Thứ 2 Tiết 1 Toán 12A11”, rồi bấm Phân tích lại.');if(mode==='weekly'&&!rows.length)warnings.push('Chưa tìm thấy họ tên trong chữ nhận diện. Kiểm tra dấu, lỗi OCR hoặc nhập thêm cách viết tắt đúng của tên mình.');return {rows,warnings:[...new Set(warnings)]};}
 function groupWords(words){const lines=[];for(const w of [...words].sort((a,b)=>a.y-b.y||a.x-b.x)){let l=lines.find(l=>Math.abs(l.y-w.y)<=Math.max(5,(w.h||12)*.55));if(!l){l={y:w.y,words:[]};lines.push(l)}l.words.push(w)}return lines.sort((a,b)=>a.y-b.y).map(l=>({...l,words:l.words.sort((a,b)=>a.x-b.x),text:l.words.sort((a,b)=>a.x-b.x).map(w=>w.text).join(' ')}));}
 // Table parsing uses cell bounds before joining text. A second header starts
 // the afternoon section; text-only PDF coordinates use row-number anchors.
 function flexibleGrid(words,options={}){
  if(!options.personal)return [];
  const lines=groupWords(words),bands=[];
  for(const l of lines){const found=[];for(let i=0;i<l.words.length;i++){const w=l.words[i],next=l.words[i+1],single=weekday(w.text),d=single??weekday(w.text+' '+(next?.text||''));if(d!==null&&!found.some(h=>h.day===d)){const end=single!==null?w.x+w.w:next.x+next.w;found.push({day:d,x:(w.x+end)/2});}}if(found.length>=3)bands.push({y:l.y,headers:found.sort((a,b)=>a.x-b.x)});}
  const rules=options.geometry||{},center=w=>w.y+(w.h||0)/2;
  // Colored headers survive OCR mistakes such as “Thớ” and “THø”. The
  // columns are explicitly Monday–Saturday/Sunday in the import form.
  if(rules.headers?.length&&rules.x?.length>=8){
   const edges=rules.x,columns=Math.min(7,edges.length-2),rows=[];
   for(let section=0;section<rules.headers.length;section++){
    const head=rules.headers[section],next=rules.headers[section+1]?.top??Infinity;
    const ys=rules.y.filter(y=>y>=head.bottom-5&&y<next-5),isPM=section>0||options.firstSession==='afternoon',limit=isPM?3:5;
    for(let ri=0;ri<Math.min(limit,ys.length-1);ri++)for(let ci=0;ci<columns;ci++){
     const cellWords=words.filter(w=>w.x+w.w/2>edges[ci+1]&&w.x+w.w/2<edges[ci+2]&&center(w)>ys[ri]&&center(w)<ys[ri+1]);
     const cell=groupWords(cellWords).map(l=>l.text).join(' ').trim();if(!cell||!/\p{L}/u.test(cell))continue;
     const cls=className(cell)||options.classHint||'',subject=cell.replace(/\b(?:1[0-2]|[6-9])\s*[a-zA-ZĐđ]{1,2}\s*\d{1,2}\b/,'').replace(/^\s*[-–:]+\s*/,'').trim();
     rows.push({day:(ci+1)%7,period:ri+1+(isPM?5:0),class:cls,subject:subject||cell,room:''});
    }
   }
   if(rows.length)return rows;
  }
  if(!bands.length)return [];
  const out=[];
  for(let bi=0;bi<bands.length;bi++){
   const band=bands[bi],endY=bands[bi+1]?.y??Infinity,hs=band.headers;
   const before=lines.filter(l=>l.y<band.y).map(l=>norm(l.text)).join(' ');
   const afternoon=options.firstSession==='afternoon'||bi>0||before.lastIndexOf('buoi chieu')>before.lastIndexOf('buoi sang');
   let xs=rules.x||[],ys=rules.y||[];
   const columnEdges=hs.map((h,i)=>{
    const left=xs.filter(x=>x<h.x).at(-1),right=xs.find(x=>x>h.x);
    return left!==undefined&&right!==undefined?[left,right]:[i?(hs[i-1].x+h.x)/2:h.x-(hs[1].x-h.x)/2,i<hs.length-1?(h.x+hs[i+1].x)/2:h.x+(h.x-hs[i-1].x)/2];
   });
   const anchors=[];
   for(const l of lines){if(l.y<=band.y||l.y>=endY)continue;const left=l.words.filter(w=>w.x+w.w/2<columnEdges[0][0]);const text=left.map(w=>w.text).join(' ').trim(),m=text.match(/^(?:tiet\s*)?([1-8])(?:\s*([SC]))?$/i);if(m){const num=+m[1],explicit=m[2]?.toUpperCase();const p=explicit==='C'?num+5:explicit==='S'?num:afternoon&&num<=5?num+5:num;if(p>=1&&p<=8)anchors.push({y:left.reduce((a,w)=>a+center(w),0)/left.length,p});}}
   anchors.sort((a,b)=>a.y-b.y);
   for(let ri=0;ri<anchors.length;ri++){
    const a=anchors[ri],upper=ys.filter(y=>y<a.y).at(-1),lower=ys.find(y=>y>a.y);
    const top=upper??(ri?(anchors[ri-1].y+a.y)/2:band.y+25),bottom=lower??(anchors[ri+1]?(a.y+anchors[ri+1].y)/2:Math.min(endY,a.y+(a.y-(anchors[ri-1]?.y??band.y))/2));
    for(let ci=0;ci<hs.length;ci++){
     const [left,right]=columnEdges[ci],cellWords=words.filter(w=>w.x+w.w/2>left&&w.x+w.w/2<right&&center(w)>top&&center(w)<bottom);
     const cell=groupWords(cellWords).map(l=>l.text).join(' ').replace(/\s+/g,' ').trim();if(!cell||!/\p{L}/u.test(cell)||/^(thu\s*[2-7]|buoi chieu|buoi sang)$/i.test(norm(cell)))continue;
     const cls=className(cell)||options.classHint||'',subject=cell.replace(/\b(?:1[0-2]|[6-9])\s*[a-zA-ZĐđ]{1,2}\s*\d{1,2}\b/,'').replace(/^\s*[-–:]+\s*/,'').trim();
     if(!out.some(r=>r.day===hs[ci].day&&r.period===a.p))out.push({day:hs[ci].day,period:a.p,class:cls,subject:subject||cell,room:''});
    }
   }
  }
  return out;
 }
 return {parse,grid:flexibleGrid,groupWords,nameMatch,weekday,dateForDay};
});
