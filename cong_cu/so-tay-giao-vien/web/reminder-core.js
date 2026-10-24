(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.TeacherReminder=factory();})(typeof window!=='undefined'?window:globalThis,function(){
  const DEFAULT_TIMES=['07:00','08:00','08:50','09:40','10:30','14:00','14:55','15:45'];
  const END_TIMES=['07:45','08:45','09:35','10:25','11:15','14:45','15:40','16:30'];
  function periodLabel(p,lang='vi'){p=Number(p);if(p<1||p>8)return '';return lang==='en'?'Period '+(p<=5?p:p-5)+(p<=5?' AM':' PM'):'Tiết '+(p<=5?p:p-5)+(p<=5?' S':' C')}
  const DAY=86400000;
  function schoolDate(now=Date.now()){return new Date(now+7*3600000).toISOString().slice(0,10)}
  function when(date,time){if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))return NaN;const d=new Date(date+'T'+time+':00+07:00');if(!Number.isFinite(+d))return NaN;if(new Date(d.getTime()+7*3600000).toISOString().slice(0,10)!==date)return NaN;return d.getTime()}
  function build(data,now=Date.now()){
    if(data.remindersEnabled===false)return [];
    const events=[],en=data.lang==='en';
    const add=(id,title,at,repeatMs,body)=>{if(!Number.isFinite(at))return;if(repeatMs&&at<now)at+=Math.ceil((now-at)/repeatMs)*repeatMs;if(at<now-60000)return;events.push({id:String(id),title:String(title).slice(0,160),body:String(body||'').slice(0,350),at,repeatMs:repeatMs||0})};
    for(const t of data.tasks||[]){if(t.done)continue;const at=when(t.date,t.time);const repeat=t.repeat==='daily'?DAY:t.repeat==='weekly'?7*DAY:0;const offsets=[...new Set([Math.max(0,Math.min(10080,Number(t.rem)||0)),0])];for(const minutes of offsets)add('task:'+t.id+':'+minutes,t.title,at-minutes*60000,repeat,(minutes?(en?'In '+minutes+' minutes · ':'Còn '+minutes+' phút · '):(en?'Due now · ':'Đến giờ · '))+(t.class||(en?'Teacher task':'Công việc giáo viên')));}
    const date=schoolDate(now),day=new Date(date+'T12:00:00+07:00').getUTCDay();
    for(const l of data.lessons||[]){const p=Number(l.period)-1,time=(data.times||DEFAULT_TIMES)[p];if(p<0||p>7||!time)continue;const delta=(Number(l.day)-day+7)%7;const at=when(date,time)+delta*DAY;for(const minutes of [...new Set([Math.max(0,Math.min(1440,Number(data.lessonReminder??15))),0])])add('lesson:'+l.id+':'+minutes,(l.class||'Lớp học')+' · '+(l.subject||'Tiết dạy'),at-minutes*60000,7*DAY,(minutes?(en?'Lesson soon · ':'Sắp vào tiết · '):(en?'Lesson starts now · ':'Đến giờ vào tiết · '))+periodLabel(l.period,data.lang)+(l.room?' · '+l.room:''));}
    return events.sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));
  }
  function validateRows(rows,mode){if(!Array.isArray(rows)||rows.length>200)throw Error('Kết quả nhận diện không hợp lệ hoặc vượt 200 dòng.');return rows.map(r=>{if(mode==='timetable'){const day=Number(r.day),period=Number(r.period);if(!Number.isInteger(day)||day<0||day>6||!Number.isInteger(period)||period<1||period>8||(!String(r.class||'').trim()&&!String(r.subject||'').trim()))throw Error('Có tiết chưa rõ thứ, tiết hoặc nội dung. Hãy nhận diện lại ảnh rõ hơn.');return {day,period,class:String(r.class).slice(0,60),subject:String(r.subject||'').slice(0,160),room:String(r.room||'').slice(0,100)}}if(!String(r.title||'').trim()||!Number.isFinite(when(r.date,r.time)))throw Error('Có công việc thiếu ngày, giờ hoặc nội dung. Hãy bổ sung tuần áp dụng rồi nhận diện lại.');return {title:String(r.title).slice(0,300),date:r.date,time:r.time,class:String(r.class||'').slice(0,60),cat:[0,1,2].includes(Number(r.cat))?Number(r.cat):2};})}
  return {periodLabel,DEFAULT_TIMES,END_TIMES,schoolDate,when,build,validateRows};
});


