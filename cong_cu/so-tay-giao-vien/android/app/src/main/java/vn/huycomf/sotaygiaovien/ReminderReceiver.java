package vn.huycomf.sotaygiaovien;
import android.content.*;
public class ReminderReceiver extends BroadcastReceiver {
  @Override public void onReceive(Context context,Intent intent){if("vn.huycomf.sotaygiaovien.REMIND".equals(intent.getAction()))ReminderScheduler.deliver(context,intent.getStringExtra("id"));}
}
