'use client';

import { useState, useEffect } from 'react';

const CARING_MESSAGES = [
  "your card for today is waiting",
  "a quiet minute, if you have one",
  "today's card is here whenever you are",
  "the day has a card now",
  "there's a card for this afternoon",
  "one card, whenever you get to it",
  "a small pause is on offer",
  "the card is drawn and nobody is hurrying you",
];

function getRandomMessage() {
  return CARING_MESSAGES[Math.floor(Math.random() * CARING_MESSAGES.length)];
}

export default function NotificationSettings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState('09:00');
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [testSuccess, setTestSuccess] = useState(false);

  useEffect(() => {
    // Check current notification permission
    if ('Notification' in window) {
      console.log('Notifications supported. Current permission:', Notification.permission);
      setPermission(Notification.permission);
    } else {
      console.error('Notifications not supported in this browser');
    }

    // Load saved settings
    const enabled = localStorage.getItem('notificationsEnabled') === 'true';
    const savedTime = localStorage.getItem('notificationTime') || '09:00';
    console.log('Loaded settings:', { enabled, savedTime });
    setNotificationsEnabled(enabled);
    setNotificationTime(savedTime);

    // Schedule notifications if enabled
    if (enabled && Notification.permission === 'granted') {
      console.log('Scheduling notification for', savedTime);
      scheduleNotification(savedTime);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('this browser can\'t show notifications.');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        setNotificationsEnabled(true);
        localStorage.setItem('notificationsEnabled', 'true');
        scheduleNotification(notificationTime);

        // Show test notification
        new Notification('slow garden', {
          body: 'notifications are on. you\'ll hear from us once a day, at the time you picked.',
          tag: 'setup',
          requireInteraction: false,
        });
      } else if (result === 'denied') {
        alert('notifications were blocked. they can be switched back on in your browser settings.');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      alert('the browser didn\'t answer the permission request. it may work if you try again.');
    }
  };

  const scheduleNotification = (time: string) => {
    // Cancel any existing scheduled notifications
    const existingTimeout = localStorage.getItem('notificationTimeoutId');
    if (existingTimeout) {
      clearTimeout(parseInt(existingTimeout));
    }

    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      0
    );

    // If scheduled time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilNotification = scheduledTime.getTime() - now.getTime();

    const timeoutId = setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification('Slow Garden ✨', {
          body: getRandomMessage(),
          tag: 'daily-card',
          requireInteraction: false,
        });
      }

      // Schedule next day's notification
      scheduleNotification(time);
    }, timeUntilNotification);

    localStorage.setItem('notificationTimeoutId', timeoutId.toString());
  };

  const handleToggle = () => {
    if (!notificationsEnabled && permission !== 'granted') {
      requestPermission();
    } else {
      const newValue = !notificationsEnabled;
      setNotificationsEnabled(newValue);
      localStorage.setItem('notificationsEnabled', newValue.toString());

      if (newValue) {
        scheduleNotification(notificationTime);
      }
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setNotificationTime(newTime);
    localStorage.setItem('notificationTime', newTime);

    if (notificationsEnabled && permission === 'granted') {
      scheduleNotification(newTime);
    }
  };

  const testNotification = () => {
    console.log('Test button clicked. Permission:', permission);

    if (permission !== 'granted') {
      console.warn('Permission not granted:', permission);
      alert('notifications are switched off for now. turn them on first, then try the test again.');
      return;
    }

    try {
      console.log('Creating test notification...');
      const message = getRandomMessage();
      console.log('Using message:', message);

      const notification = new Notification('Slow Garden ✨', {
        body: message,
        tag: 'test-' + Date.now(),
        requireInteraction: false,
      });

      notification.onclick = () => {
        console.log('Notification clicked!');
        window.focus();
        notification.close();
      };

      notification.onerror = (error) => {
        console.error('Notification error:', error);
      };

      notification.onshow = () => {
        console.log('Notification shown successfully!');
      };

      console.log('Test notification created:', notification);

      // Show visual confirmation
      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 5000);
    } catch (error) {
      console.error('Error creating notification:', error);
      alert('couldn\'t send it: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 md:px-8 py-12">
      <h1 className="text-4xl md:text-5xl font-handwritten text-forest-900 mb-8">
        notifications
      </h1>

      <div className="space-y-8">
        {/* Enable/Disable Toggle */}
        <div className="bg-cream-100/50 border border-forest-200 rounded-xl p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 pr-4">
              <h3 className="text-2xl font-light text-forest-900 mb-2">
                daily reminder
              </h3>
              <p className="text-forest-600 text-lg font-light">
                a small note when your card is ready
              </p>
            </div>
            <button
              onClick={handleToggle}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                notificationsEnabled ? 'bg-forest-500' : 'bg-forest-200'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-cream-50 transition-transform ${
                  notificationsEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {permission === 'denied' && (
            <p className="text-clay-600 text-base font-light mt-4 p-4 bg-clay-50 rounded-lg">
              notifications are blocked. they can be allowed again in your browser settings.
            </p>
          )}
        </div>

        {/* Time Picker */}
        {notificationsEnabled && permission === 'granted' && (
          <div className="bg-cream-100/50 border border-forest-200 rounded-xl p-8">
            <h3 className="text-2xl font-light text-forest-900 mb-6">
              what time suits you?
            </h3>
            <input
              type="time"
              value={notificationTime}
              onChange={handleTimeChange}
              className="w-full px-6 py-4 bg-cream-50 border border-forest-300 rounded-lg text-forest-900 font-light text-2xl focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
            <p className="text-forest-600 text-lg font-light mt-4">
              one notification a day, at this time
            </p>
          </div>
        )}

        {/* Test Button */}
        {notificationsEnabled && permission === 'granted' && (
          <div>
            <button
              onClick={testNotification}
              className="w-full px-8 py-4 bg-forest-100 hover:bg-forest-200 text-forest-800 font-light rounded-xl transition-all text-xl"
            >
              send a test
            </button>

            {testSuccess && (
              <div className="mt-4 p-4 bg-sage-100 border border-sage-300 rounded-lg text-forest-900 text-lg font-light animate-fade-in">
                sent. it should appear in a moment.
                <br />
                <span className="text-base">if nothing shows up, check your system's notification centre. the browser or the device may be holding it back even though permission was given.</span>
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="bg-sage-50/50 border border-sage-200 rounded-xl p-8">
          <h4 className="text-2xl font-light text-forest-900 mb-4">
            how this works
          </h4>
          <ul className="text-forest-700 text-lg font-light space-y-3">
            <li>• works best on android and desktop</li>
            <li>• on iphone, safari has to stay open in the background</li>
            <li>• the time can be changed whenever</li>
            <li>• the messages are short and don't ask anything of you</li>
          </ul>
        </div>

        {/* Troubleshooting */}
        {notificationsEnabled && permission === 'granted' && (
          <div className="bg-clay-50/50 border border-clay-200 rounded-xl p-8">
            <h4 className="text-2xl font-light text-forest-900 mb-4">
              not seeing them?
            </h4>
            <ul className="text-forest-700 text-lg font-light space-y-3">
              <li>• <strong>mac:</strong> system settings → notifications → chrome or safari</li>
              <li>• <strong>windows:</strong> settings → system → notifications → chrome</li>
              <li>• <strong>do not disturb:</strong> focus modes can hide them, so try switching it off for a bit</li>
              <li>• <strong>notification centre:</strong> top right on a mac, bottom right on windows</li>
              <li>• closing and reopening the browser sometimes helps</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
