package vn.huycomf.sotaygiaovien;

import android.Manifest;
import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.util.Base64;
import android.webkit.*;
import android.widget.Toast;
import org.json.JSONObject;
import java.io.*;
import java.util.*;

public class MainActivity extends Activity {
  private WebView web;
  private ValueCallback<Uri[]> fileCallback;
  private byte[] pendingBytes;
  private static final String ORIGIN="https://appassets.androidplatform.net";
  @Override public void onCreate(Bundle state){
    super.onCreate(state);
    getWindow().setStatusBarColor(Color.rgb(231,236,240));
    web=new WebView(this);web.setBackgroundColor(Color.rgb(231,236,240));
    web.setFitsSystemWindows(true);
    if(Build.VERSION.SDK_INT>=21)web.setOnApplyWindowInsetsListener((v,insets)->{v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());return insets.consumeSystemWindowInsets();});
    setContentView(web);
    WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setAllowFileAccess(false);s.setAllowContentAccess(true);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);s.setMediaPlaybackRequiresUserGesture(true);
    web.addJavascriptInterface(new NativeBridge(),"AndroidApp");
    web.setWebViewClient(new WebViewClient(){
      @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest req){
        Uri u=req.getUrl();
        if(!"https".equals(u.getScheme())||!"appassets.androidplatform.net".equals(u.getHost()))return null;
        String path=u.getPath();if(path==null||!path.startsWith("/assets/"))return missing();
        path=path.substring(8);if(path.isEmpty())path="index.html";
        if(path.contains("..")||path.contains("\\"))return missing();
        try{String mime=path.endsWith(".html")?"text/html":path.endsWith(".js")?"application/javascript":path.endsWith(".css")?"text/css":path.endsWith(".svg")?"image/svg+xml":path.endsWith(".json")?"application/json":"application/octet-stream";
          return new WebResourceResponse(mime,"UTF-8",getAssets().open(path));
        }catch(IOException ex){return missing();}
      }
      @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest req){String url=req.getUrl().toString();if(url.startsWith(ORIGIN+"/assets/"))return false;openExternal(url);return true;}
    });
    web.setWebChromeClient(new WebChromeClient(){
      @Override public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> callback,FileChooserParams params){if(fileCallback!=null)fileCallback.onReceiveValue(null);fileCallback=callback;try{if(params.isCaptureEnabled()){Uri photo=Uri.parse("content://vn.huycomf.sotaygiaovien.capture/capture.jpg");Intent camera=new Intent(android.provider.MediaStore.ACTION_IMAGE_CAPTURE);camera.putExtra(android.provider.MediaStore.EXTRA_OUTPUT,photo);camera.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION);camera.setClipData(android.content.ClipData.newRawUri("schedule",photo));if(camera.resolveActivity(getPackageManager())!=null){startActivityForResult(camera,14);return true;}}Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);String[] types=params.getAcceptTypes();i.setType(types.length==1&&!types[0].isEmpty()?types[0]:"*/*");if(types.length>1)i.putExtra(Intent.EXTRA_MIME_TYPES,types);startActivityForResult(i,10);return true;}catch(Exception e){fileCallback=null;callback.onReceiveValue(null);return true;}}
    });
    web.setDownloadListener((url,ua,cd,mime,length)->{if(url.startsWith("data:")){int comma=url.indexOf(',');if(comma>0){try{pendingBytes=Base64.decode(url.substring(comma+1),Base64.DEFAULT);saveDocument("tai-lieu",mime);}catch(Exception e){message("Không thể lưu tệp này");}}}else openExternal(url);});
    NotificationManager nm=getSystemService(NotificationManager.class);nm.createNotificationChannel(new NotificationChannel("reminders","Nhắc việc giáo viên",NotificationManager.IMPORTANCE_DEFAULT));
    web.loadUrl(ORIGIN+"/assets/index.html");
  }
  private WebResourceResponse missing(){return new WebResourceResponse("text/plain","UTF-8",404,"Not found",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}
  private void message(String m){runOnUiThread(()->Toast.makeText(this,m,Toast.LENGTH_LONG).show());}
  private void openExternal(String url){try{Uri u=Uri.parse(url);if(!"https".equals(u.getScheme())&&!"http".equals(u.getScheme()))return;startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception e){message("Không tìm thấy ứng dụng mở liên kết");}}
  private void saveDocument(String name,String mime){Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType(mime==null||mime.isEmpty()?"application/octet-stream":mime);i.putExtra(Intent.EXTRA_TITLE,name);startActivityForResult(i,12);}
  public class NativeBridge {
    @JavascriptInterface public void requestKpi(String requestId,String requestJson){
      if(requestId==null||requestId.length()>100||requestJson==null||requestJson.length()>12000)return;
      new Thread(()->{String result;java.net.HttpURLConnection connection=null;try{
        JSONObject call=new JSONObject(requestJson);String action=call.optString("action");
        if(!Arrays.asList("login","overview","logout").contains(action))throw new IllegalArgumentException("Unsupported KPI action");
        connection=(java.net.HttpURLConnection)new java.net.URL("https://gvmhaiotbqipoqwokilz.supabase.co/functions/v1/kpi-api").openConnection();connection.setConnectTimeout(30000);connection.setReadTimeout(action.equals("login")?120000:30000);connection.setRequestMethod("POST");connection.setDoOutput(true);connection.setRequestProperty("Content-Type","application/json");connection.setRequestProperty("apikey","sb_publishable_DpNcbAwzO1vPzqF7VWHiOw_VPtt9wzb");connection.setRequestProperty("x-region","ap-southeast-1");String token=call.optString("token");if(!token.isEmpty())connection.setRequestProperty("x-kpi-token",token);
        JSONObject body=new JSONObject();body.put("action",action);body.put("payload",call.optJSONObject("payload")==null?new JSONObject():call.optJSONObject("payload"));try(OutputStream out=connection.getOutputStream()){out.write(body.toString().getBytes("UTF-8"));}
        InputStream stream=connection.getResponseCode()<400?connection.getInputStream():connection.getErrorStream();ByteArrayOutputStream bytes=new ByteArrayOutputStream();byte[] buffer=new byte[8192];int n;while(stream!=null&&(n=stream.read(buffer))!=-1){bytes.write(buffer,0,n);if(bytes.size()>5000000)throw new IOException("KPI response too large");}if(stream!=null)stream.close();result=bytes.toString("UTF-8");new JSONObject(result);
      }catch(Exception ex){result="{\"ok\":false,\"error\":\"Không thể kết nối KPI trường. Kiểm tra Internet rồi thử lại.\"}";}finally{if(connection!=null)connection.disconnect();}
      final String response=result;runOnUiThread(()->{if(!isFinishing()&&!isDestroyed())web.evaluateJavascript("window.onKpiNativeResult&&window.onKpiNativeResult("+JSONObject.quote(requestId)+","+JSONObject.quote(response)+")",null);});
      }).start();
    }
    @JavascriptInterface public void syncReminders(String json){ReminderScheduler.sync(MainActivity.this,json);}
    @JavascriptInterface public String reminderStatus(){return ReminderScheduler.status(MainActivity.this);}
    @JavascriptInterface public void testReminder(){ReminderScheduler.test(MainActivity.this);}
    @JavascriptInterface public void requestExactAlarms(){runOnUiThread(()->{try{if(Build.VERSION.SDK_INT>=31&&!ReminderScheduler.exact(MainActivity.this))startActivity(new Intent(android.provider.Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,Uri.parse("package:"+getPackageName())));else message("Đã cho phép báo thức chính xác");}catch(Exception e){message("Mở Cài đặt hệ thống > Báo thức và lời nhắc để cho phép ứng dụng.");}});}
    @JavascriptInterface public void openNotificationSettings(){runOnUiThread(()->{try{startActivity(new Intent(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(android.provider.Settings.EXTRA_APP_PACKAGE,getPackageName()));}catch(Exception e){message("Mở Cài đặt > Ứng dụng > Sổ tay Giáo viên > Thông báo.");}});}
    @JavascriptInterface public void openBatterySettings(){runOnUiThread(()->{try{startActivity(new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS,Uri.parse("package:"+getPackageName())));}catch(Exception ignored){}});}
    @JavascriptInterface public void openLink(String url){runOnUiThread(()->openExternal(url));}
    @JavascriptInterface public void saveFile(String name,String mime,String encoded){if(encoded.length()>16000000){message("Bản sao quá lớn. Hãy bỏ bớt tệp đính kèm.");return;}try{byte[] bytes=Base64.decode(encoded,Base64.DEFAULT);runOnUiThread(()->{pendingBytes=bytes;try{saveDocument(name,mime);}catch(Exception e){pendingBytes=null;message("Không thể mở trình lưu tệp");}});}catch(Exception e){message("Dữ liệu tệp không hợp lệ");}}
    @JavascriptInterface public void enableNotifications(){runOnUiThread(()->{ReminderScheduler.channel(MainActivity.this);if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},13);else if(!ReminderScheduler.allowed(MainActivity.this))openNotificationSettings();else message("Đã bật thông báo nền Android");});}
    @JavascriptInterface public void notifyReminder(String title){runOnUiThread(()->{if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)return;Notification n=new Notification.Builder(MainActivity.this,"reminders").setSmallIcon(getApplicationInfo().icon).setContentTitle("Sổ tay Giáo viên").setContentText(title).setAutoCancel(true).build();getSystemService(NotificationManager.class).notify(title.hashCode(),n);});}
    @JavascriptInterface public void startVoice(){runOnUiThread(()->{Intent i=new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);i.putExtra(RecognizerIntent.EXTRA_LANGUAGE,"vi-VN");i.putExtra(RecognizerIntent.EXTRA_PROMPT,"Thầy cô đọc ghi chú");try{startActivityForResult(i,11);}catch(Exception e){message("Máy chưa có bộ nhận giọng nói. Vui lòng nhập bằng bàn phím.");}});}
  }
  @Override protected void onActivityResult(int req,int result,Intent data){super.onActivityResult(req,result,data);
    if(req==14&&fileCallback!=null){fileCallback.onReceiveValue(result==RESULT_OK?new Uri[]{Uri.parse("content://vn.huycomf.sotaygiaovien.capture/capture.jpg")}:null);fileCallback=null;}
    if(req==10&&fileCallback!=null){fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result,data));fileCallback=null;}
    if(req==11&&result==RESULT_OK&&data!=null){ArrayList<String> words=data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);if(words!=null&&!words.isEmpty())web.evaluateJavascript("window.onNativeVoice&&window.onNativeVoice("+JSONObject.quote(words.get(0))+")",null);}
    if(req==12){byte[] bytes=pendingBytes;pendingBytes=null;if(result==RESULT_OK&&data!=null&&data.getData()!=null&&bytes!=null){try(OutputStream out=getContentResolver().openOutputStream(data.getData())){if(out!=null){out.write(bytes);message("Đã lưu tệp");}}catch(Exception e){message("Không thể lưu tệp");}}}
  }
  @Override public void onBackPressed(){if(web.canGoBack())web.goBack();else super.onBackPressed();}
  @Override protected void onResume(){super.onResume();ReminderScheduler.restore(this);if(web!=null)web.evaluateJavascript("window.onReminderResume&&window.onReminderResume()",null);}
  @Override protected void onDestroy(){web.removeJavascriptInterface("AndroidApp");web.destroy();super.onDestroy();}
}

