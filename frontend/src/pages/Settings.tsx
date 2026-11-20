import React, { useState } from 'react';
import { Settings, Bell, Lock, Globe, Palette, Shield, Key, Check } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [saveMessage, setSaveMessage] = useState('');

  // General Settings
  const [currency, setCurrency] = useState(() => localStorage.getItem('currency') || 'USD ($)');
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'English');
  const [dateFormat, setDateFormat] = useState(() => localStorage.getItem('dateFormat') || 'MM/DD/YYYY');

  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(() => localStorage.getItem('emailNotifications') !== 'false');
  const [budgetAlerts, setBudgetAlerts] = useState(() => localStorage.getItem('budgetAlerts') !== 'false');
  const [paymentReminders, setPaymentReminders] = useState(() => localStorage.getItem('paymentReminders') !== 'false');
  const [weeklySummary, setWeeklySummary] = useState(() => localStorage.getItem('weeklySummary') === 'true');

  // Appearance Settings
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'Light');
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem('compactMode') === 'true');

  // Security Settings
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const showSaveMessage = (msg: string) => {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // Save General Settings
  const saveGeneralSettings = () => {
    localStorage.setItem('currency', currency);
    localStorage.setItem('language', language);
    localStorage.setItem('dateFormat', dateFormat);
    showSaveMessage('General settings saved successfully!');
  };

  // Save Notification Settings
  const saveNotificationSettings = () => {
    localStorage.setItem('emailNotifications', String(emailNotifications));
    localStorage.setItem('budgetAlerts', String(budgetAlerts));
    localStorage.setItem('paymentReminders', String(paymentReminders));
    localStorage.setItem('weeklySummary', String(weeklySummary));
    showSaveMessage('Notification preferences saved!');
  };

  // Save Appearance Settings
  const saveAppearanceSettings = () => {
    localStorage.setItem('theme', theme);
    localStorage.setItem('compactMode', String(compactMode));
    showSaveMessage('Appearance settings saved!');
  };

  // Handle Password Change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    // In a real app, you'd call an API to change the password
    setPasswordSuccess('Password changed successfully!');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswordForm(false);
    
    setTimeout(() => setPasswordSuccess(''), 3000);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Customize your experience and manage your account.</p>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <Check className="w-4 h-4" />
          {saveMessage}
        </div>
      )}

      {/* Password Success */}
      {passwordSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <Check className="w-4 h-4" />
          {passwordSuccess}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="text-gray-900 font-medium">Currency</p>
                    <p className="text-sm text-gray-500">Choose your preferred currency</p>
                  </div>
                  <select 
                    value={currency} 
                    onChange={(e) => setCurrency(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>USD ($)</option>
                    <option>EUR (€)</option>
                    <option>GBP (£)</option>
                    <option>LBP (ل.ل)</option>
                    <option>SAR (﷼)</option>
                    <option>AED (د.إ)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="text-gray-900 font-medium">Language</p>
                    <p className="text-sm text-gray-500">Select your language</p>
                  </div>
                  <select 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>English</option>
                    <option>العربية</option>
                    <option>Français</option>
                    <option>Español</option>
                  </select>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="text-gray-900 font-medium">Date Format</p>
                    <p className="text-sm text-gray-500">Choose date display format</p>
                  </div>
                  <select 
                    value={dateFormat} 
                    onChange={(e) => setDateFormat(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>MM/DD/YYYY</option>
                    <option>DD/MM/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
              </div>

              <button
                onClick={saveGeneralSettings}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
              
              <div className="space-y-2">
                {[
                  { title: 'Email Notifications', desc: 'Receive financial updates via email', state: emailNotifications, setState: setEmailNotifications },
                  { title: 'Budget Alerts', desc: 'Get notified when nearing budget limits', state: budgetAlerts, setState: setBudgetAlerts },
                  { title: 'Payment Reminders', desc: 'Reminders for upcoming bills', state: paymentReminders, setState: setPaymentReminders },
                  { title: 'Weekly Summary', desc: 'Weekly report of your finances', state: weeklySummary, setState: setWeeklySummary },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <p className="text-gray-900 font-medium">{item.title}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={item.state}
                        onChange={(e) => item.setState(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                    </label>
                  </div>
                ))}
              </div>

              <button
                onClick={saveNotificationSettings}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Save Preferences
              </button>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
              
              <div className="space-y-3">
                {/* Change Password */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Key className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-gray-900 font-medium">Change Password</p>
                        <p className="text-sm text-gray-500">Update your account password</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPasswordForm(!showPasswordForm)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {showPasswordForm ? 'Cancel' : 'Change'}
                    </button>
                  </div>

                  {showPasswordForm && (
                    <form onSubmit={handlePasswordChange} className="mt-4 space-y-3">
                      {passwordError && (
                        <p className="text-sm text-red-600">{passwordError}</p>
                      )}
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Current Password</label>
                        <input
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">New Password</label>
                        <input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Confirm New Password</label>
                        <input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Update Password
                      </button>
                    </form>
                  )}
                </div>

                {/* Two-Factor Auth */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-gray-900 font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-500">Add extra security to your account</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">Disabled</span>
                  </div>
                </div>

                {/* Active Sessions */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-gray-900 font-medium">Active Sessions</p>
                        <p className="text-sm text-gray-500">Manage your logged-in devices</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">1 device</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Appearance</h3>
              
              <div className="space-y-4">
                <div className="py-3 border-b border-gray-100">
                  <p className="text-gray-900 font-medium mb-3">Theme</p>
                  <div className="flex gap-3">
                    {['Light', 'Dark', 'System'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          theme === t
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="text-gray-900 font-medium">Compact Mode</p>
                    <p className="text-sm text-gray-500">Reduce spacing for more content on screen</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={compactMode}
                      onChange={(e) => setCompactMode(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                  </label>
                </div>
              </div>

              <button
                onClick={saveAppearanceSettings}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Save Appearance
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;