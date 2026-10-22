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
      @Override public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> callback,FileChooserParams params){if(fileCallback!=null)fileCallback.onReceiveValue(null);fileCallback=callback;try{Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);String[] types=params.getAcceptTypes();i.setType(types.length==1&&!types[0].isEmpty()?types[0]:"*/*");if(types.length>1)i.putExtra(Intent.EXTRA_MIME_TYPES,types);startActivityForResult(i,10);return true;}catch(Exception e){fileCallback=null;callback.onReceiveValue(null);return true;}}
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
    @JavascriptInterface public void openLink(String url){runOnUiThread(()->openExternal(url));}
    @JavascriptInterface public void saveFile(String name,String mime,String encoded){if(encoded.length()>16000000){message("Bản sao quá lớn. Hãy bỏ bớt tệp đính kèm.");return;}try{byte[] bytes=Base64.decode(encoded,Base64.DEFAULT);runOnUiThread(()->{pendingBytes=bytes;try{saveDocument(name,mime);}catch(Exception e){pendingBytes=null;message("Không thể mở trình lưu tệp");}});}catch(Exception e){message("Dữ liệu tệp không hợp lệ");}}
    @JavascriptInterface public void enableNotifications(){runOnUiThread(()->{if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},13);else message("Đã bật thông báo khi ứng dụng đang mở");});}
    @JavascriptInterface public void notifyReminder(String title){runOnUiThread(()->{if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)return;Notification n=new Notification.Builder(MainActivity.this,"reminders").setSmallIcon(getApplicationInfo().icon).setContentTitle("Sổ tay Giáo viên").setContentText(title).setAutoCancel(true).build();getSystemService(NotificationManager.class).notify(title.hashCode(),n);});}
    @JavascriptInterface public void startVoice(){runOnUiThread(()->{Intent i=new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);i.putExtra(RecognizerIntent.EXTRA_LANGUAGE,"vi-VN");i.putExtra(RecognizerIntent.EXTRA_PROMPT,"Thầy cô đọc ghi chú");try{startActivityForResult(i,11);}catch(Exception e){message("Máy chưa có bộ nhận giọng nói. Vui lòng nhập bằng bàn phím.");}});}
  }
  @Override protected void onActivityResult(int req,int result,Intent data){super.onActivityResult(req,result,data);
    if(req==10&&fileCallback!=null){fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result,data));fileCallback=null;}
    if(req==11&&result==RESULT_OK&&data!=null){ArrayList<String> words=data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);if(words!=null&&!words.isEmpty())web.evaluateJavascript("window.onNativeVoice&&window.onNativeVoice("+JSONObject.quote(words.get(0))+")",null);}
    if(req==12){byte[] bytes=pendingBytes;pendingBytes=null;if(result==RESULT_OK&&data!=null&&data.getData()!=null&&bytes!=null){try(OutputStream out=getContentResolver().openOutputStream(data.getData())){if(out!=null){out.write(bytes);message("Đã lưu tệp");}}catch(Exception e){message("Không thể lưu tệp");}}}
  }
  @Override public void onBackPressed(){if(web.canGoBack())web.goBack();else super.onBackPressed();}
  @Override protected void onDestroy(){web.removeJavascriptInterface("AndroidApp");web.destroy();super.onDestroy();}
}
