package vn.huycomf.sotaygiaovien;
import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import org.json.*;
import java.util.*;

/** Schedules durable OS alarms; no WebView or running Activity is required to deliver them. */
public final class ReminderScheduler {
  private static final String STORE="teacher-reminders-v3",CHANNEL="teacher_reminders_high_v3";
  private static SharedPreferences prefs(Context c){return c.getSharedPreferences(STORE,Context.MODE_PRIVATE);}
  private static AlarmManager alarm(Context c){return (AlarmManager)c.getSystemService(Context.ALARM_SERVICE);}
  static JSONObject read(Context c){try{return new JSONObject(prefs(c).getString("events","{}"));}catch(Exception e){return new JSONObject();}}
  private static PendingIntent pending(Context c,String id){Intent i=new Intent(c,ReminderReceiver.class);i.setAction("vn.huycomf.sotaygiaovien.REMIND");i.setData(Uri.parse("teacher-reminder:"+Uri.encode(id)));i.putExtra("id",id);return PendingIntent.getBroadcast(c,0,i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);}
  public static void channel(Context c){NotificationChannel ch=new NotificationChannel(CHANNEL,"Nhắc lịch dạy và công việc",NotificationManager.IMPORTANCE_HIGH);ch.setDescription("Nhắc trước hạn và đúng giờ, kể cả khi đóng màn hình ứng dụng");ch.enableVibration(true);ch.setVibrationPattern(new long[]{0,300,150,300});ch.setLockscreenVisibility(Notification.VISIBILITY_PRIVATE);((NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE)).createNotificationChannel(ch);}
  public static boolean exact(Context c){return Build.VERSION.SDK_INT<31||alarm(c).canScheduleExactAlarms();}
  public static boolean allowed(Context c){NotificationChannel ch=((NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE)).getNotificationChannel(CHANNEL);if(ch!=null&&ch.getImportance()==NotificationManager.IMPORTANCE_NONE)return false;return (Build.VERSION.SDK_INT<33||c.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)==PackageManager.PERMISSION_GRANTED)&&((NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE)).areNotificationsEnabled();}
  private static void schedule(Context c,String id,JSONObject e){long at=e.optLong("at");if(at<=0)return;long now=System.currentTimeMillis();long repeat=e.optLong("repeatMs");at=Math.max(at,now+1200);try{if(exact(c))alarm(c).setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,at,pending(c,id));else alarm(c).setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,at,pending(c,id));}catch(SecurityException ex){alarm(c).setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,at,pending(c,id));}}
  public static synchronized void sync(Context c,String json){try{JSONArray input=new JSONArray(json);if(input.length()>1000)throw new JSONException("Too many reminders");JSONObject old=read(c),next=new JSONObject();for(Iterator<String> it=old.keys();it.hasNext();){String id=it.next();alarm(c).cancel(pending(c,id));}
    for(int n=0;n<input.length();n++){JSONObject e=input.getJSONObject(n);String id=e.optString("id");if(id.isEmpty()||id.length()>200||e.optLong("at")<=0)continue;long repeat=e.optLong("repeatMs");if(repeat!=0&&repeat!=86400000L&&repeat!=604800000L)continue;if(prefs(c).getLong("sent:"+id,0)!=e.optLong("at"))next.put(id,e);}
    JSONObject test=old.optJSONObject("test");if(test!=null&&test.optLong("at")>System.currentTimeMillis())next.put("test",test);
    prefs(c).edit().putString("events",next.toString()).putLong("syncedAt",System.currentTimeMillis()).commit();channel(c);for(Iterator<String> it=next.keys();it.hasNext();){String id=it.next();schedule(c,id,next.getJSONObject(id));}
  }catch(Exception ex){prefs(c).edit().putString("lastError","Không thể lập lịch: "+ex.getClass().getSimpleName()).apply();}}
  public static synchronized void restore(Context c){JSONObject data=read(c);long now=System.currentTimeMillis();try{for(Iterator<String> it=data.keys();it.hasNext();){String id=it.next();JSONObject e=data.getJSONObject(id);long at=e.optLong("at"),repeat=e.optLong("repeatMs");if(at<now){if(repeat>0&&now-at>6*3600000L){at+=((now-at)/repeat+1)*repeat;e.put("at",at);}else if(now-at>6*3600000L)continue;}schedule(c,id,e);}prefs(c).edit().putString("events",data.toString()).commit();}catch(Exception ignored){}}
  public static synchronized void deliver(Context c,String id){try{JSONObject all=read(c),e=all.optJSONObject(id);if(e==null)return;long now=System.currentTimeMillis(),at=e.optLong("at");if(at>now+2000){schedule(c,id,e);return;}channel(c);if(allowed(c)){
      Intent launch=new Intent(c,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP);PendingIntent content=PendingIntent.getActivity(c,0,launch,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
      Notification note=new Notification.Builder(c,CHANNEL).setSmallIcon(c.getResources().getIdentifier("ic_notification","drawable",c.getPackageName())).setColor(Color.rgb(15,80,60)).setContentTitle(e.optString("title","Nhắc việc giáo viên")).setContentText(e.optString("body","Đến giờ thực hiện công việc")).setStyle(new Notification.BigTextStyle().bigText(e.optString("body"))).setCategory(Notification.CATEGORY_REMINDER).setVisibility(Notification.VISIBILITY_PRIVATE).setContentIntent(content).setAutoCancel(true).setShowWhen(true).setWhen(at).build();
      ((NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE)).notify(id.hashCode(),note);prefs(c).edit().putLong("lastDelivered",now).apply();
    }else prefs(c).edit().putString("lastError","Thông báo chưa được cho phép. Mở cài đặt nhắc việc để bật.").apply();
    prefs(c).edit().putLong("sent:"+id,at).apply();long repeat=e.optLong("repeatMs");if(repeat>0){long next=at+repeat;while(next<=now)next+=repeat;e.put("at",next);all.put(id,e);prefs(c).edit().putString("events",all.toString()).commit();schedule(c,id,e);}else{all.remove(id);prefs(c).edit().putString("events",all.toString()).commit();}
  }catch(Exception ex){prefs(c).edit().putString("lastError",ex.getClass().getSimpleName()).apply();}}
  public static synchronized void test(Context c){try{JSONObject all=read(c),e=new JSONObject();e.put("id","test");e.put("title","Thử nhắc việc thành công");e.put("body","Chuông vẫn báo khi màn hình ứng dụng đã đóng.");e.put("at",System.currentTimeMillis()+60000);e.put("repeatMs",0);all.put("test",e);prefs(c).edit().putString("events",all.toString()).commit();schedule(c,"test",e);}catch(Exception ignored){}}
  public static String status(Context c){try{channel(c);JSONObject out=new JSONObject(),all=read(c);long next=Long.MAX_VALUE;int count=0;for(Iterator<String> it=all.keys();it.hasNext();){JSONObject e=all.optJSONObject(it.next());if(e!=null&&e.optLong("at")>System.currentTimeMillis()){count++;next=Math.min(next,e.optLong("at"));}}NotificationChannel ch=((NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE)).getNotificationChannel(CHANNEL);out.put("notifications",allowed(c)&&ch.getImportance()!=NotificationManager.IMPORTANCE_NONE);out.put("headsUp",ch.getImportance()>=NotificationManager.IMPORTANCE_HIGH);out.put("exact",exact(c));out.put("count",count);out.put("next",next==Long.MAX_VALUE?0:next);out.put("lastDelivered",prefs(c).getLong("lastDelivered",0));out.put("lastError",prefs(c).getString("lastError",""));return out.toString();}catch(Exception e){return "{}";}}
}



