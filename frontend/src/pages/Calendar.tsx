import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchExpenses } from '../services/expenseService';
import { fetchIncome } from '../services/incomeService';

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    loadEvents();
  }, [monthStr]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const startDate = `${monthStr}-01`;
      const endDate = `${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

      const [expenseData, incomeData] = await Promise.all([
        fetchExpenses({ start_date: startDate, end_date: endDate }),
        fetchIncome(),
      ]);

      // Filter income for this month
      const monthIncome = incomeData.filter((inc: any) => {
        const date = new Date(inc.income_date);
        return date.getMonth() === month && date.getFullYear() === year;
      });

      // Combine all events
      const allEvents = [
        ...expenseData.map((exp: any) => ({
          ...exp,
          type: 'expense',
          day: new Date(exp.expense_date).getDate(),
        })),
        ...monthIncome.map((inc: any) => ({
          ...inc,
          type: 'income',
          day: new Date(inc.income_date).getDate(),
        })),
      ];

      setEvents(allEvents);
    } catch (err) {
      console.error('Failed to load calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getEventsForDay = (day: number) => {
    return events.filter((e) => e.day === day);
  };

  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const totalExpenses = events
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const totalIncome = events
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500 text-lg">Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-500 mt-1">Track your bills, income, and payments.</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-50 rounded-lg text-gray-500 hover:text-gray-700 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">
            {monthNames[month]} {year}
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Monthly Expenses</p>
          <p className="text-xl font-bold text-red-500">-${totalExpenses.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">{events.filter(e => e.type === 'expense').length} transactions</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Monthly Income</p>
          <p className="text-xl font-bold text-green-500">+${totalIncome.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">{events.filter(e => e.type === 'income').length} transactions</p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {dayNames.map((day) => (
            <div key={day} className="p-3 text-center text-xs font-medium text-gray-500 uppercase bg-gray-100">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {/* Empty cells */}
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[100px] p-2 border border-gray-200/50 bg-gray-50" />
          ))}

          {/* Date cells */}
          {dates.map((date) => {
            const dayEvents = getEventsForDay(date);
            const isToday = date === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

            return (
              <div
                key={date}
                className={`min-h-[100px] p-2 border border-gray-200 hover:bg-gray-50/30 transition-colors ${
                  isToday ? 'bg-blue-500/5 border-blue-500/30' : ''
                }`}
              >
                <span className={`text-sm inline-flex items-center justify-center w-7 h-7 rounded-full ${
                  isToday ? 'bg-blue-600 text-gray-900 font-bold' : 'text-gray-500'
                }`}>
                  {date}
                </span>
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 3).map((event, i) => (
                    <div
                      key={i}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate ${
                        event.type === 'income'
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-red-500/10 text-red-500'
                      }`}
                      title={`${event.description || event.category_name}: $${parseFloat(event.amount).toFixed(2)}`}
                    >
                      {event.type === 'income' ? '+' : '-'}${parseFloat(event.amount).toFixed(0)} {event.description || event.category_name}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <p className="text-[10px] text-gray-500 pl-1">+{dayEvents.length - 3} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Calendar;