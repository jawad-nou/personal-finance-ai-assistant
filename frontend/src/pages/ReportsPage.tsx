import React, { useState } from 'react';
import { FileText, Download, TrendingUp, TrendingDown, Wallet, X } from 'lucide-react';
import { getDashboardStats, getExpenseSummary, getRecentTransactions } from '../services/expenseService';
import { fetchCategoryStats } from '../services/categoryService';
import { fetchIncome } from '../services/incomeService';

const ReportsPage: React.FC = () => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentYear = new Date().getFullYear().toString();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<any>(null);
  const [modalTitle, setModalTitle] = useState('');

  const generateCSV = (data: any[], filename: string, headers: string[]) => {
    let csv = headers.join(',') + '\n';
    data.forEach((row: any) => {
      csv += headers.map(h => `"${row[h] || ''}"`).join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleReportClick = async (reportType: string, reportTitle: string) => {
    setLoading(true);
    setModalTitle(reportTitle);
    
    try {
      const [stats, summary, transactions, categoryStats, income] = await Promise.all([
        getDashboardStats(currentMonth),
        getExpenseSummary(currentMonth),
        getRecentTransactions(100),
        fetchCategoryStats(currentMonth),
        fetchIncome(),
      ]);

      let data: any[] = [];
      let headers: string[] = [];
      let filename = '';

      switch (reportType) {
        case 'monthly-summary':
          filename = `Monthly_Summary_${currentMonth}`;
          headers = ['Metric', 'Value', 'Month'];
          data = [
            { Metric: 'Current Balance', Value: `$${(stats.currentBalance || 0).toFixed(2)}`, Month: currentMonth },
            { Metric: 'Monthly Income', Value: `$${(stats.monthlyIncome || 0).toFixed(2)}`, Month: currentMonth },
            { Metric: 'Monthly Expenses', Value: `$${(stats.monthlyExpenses || 0).toFixed(2)}`, Month: currentMonth },
            { Metric: 'Total Savings', Value: `$${(stats.totalSavings || 0).toFixed(2)}`, Month: currentMonth },
            { Metric: 'Net Savings Rate', Value: stats.monthlyIncome > 0 ? `${(((stats.monthlyIncome - stats.monthlyExpenses) / stats.monthlyIncome) * 100).toFixed(1)}%` : '0%', Month: currentMonth },
          ];
          break;

        case 'category-breakdown':
          filename = `Category_Breakdown_${currentMonth}`;
          headers = ['Category', 'Total Spent', 'Month'];
          data = summary.map((item: any) => ({
            Category: item.name,
            'Total Spent': `$${parseFloat(item.total).toFixed(2)}`,
            Month: currentMonth,
          }));
          break;

        case 'income-report':
          filename = `Income_Report_${currentMonth}`;
          headers = ['Description', 'Category', 'Amount', 'Date', 'Source', 'Frequency'];
          data = income.map((inc: any) => ({
            Description: inc.description || inc.category_name,
            Category: inc.category_name,
            Amount: `$${parseFloat(inc.amount).toFixed(2)}`,
            Date: new Date(inc.income_date).toLocaleDateString(),
            Source: inc.source || 'N/A',
            Frequency: inc.frequency || 'One-time',
          }));
          break;

        case 'budget-performance':
          filename = `Budget_Performance_${currentMonth}`;
          headers = ['Category', 'Budget', 'Spent', 'Remaining', 'Usage %', 'Status'];
          data = categoryStats.map((cat: any) => ({
            Category: cat.name,
            Budget: `$${parseFloat(cat.budget || 0).toFixed(2)}`,
            Spent: `$${parseFloat(cat.spent || 0).toFixed(2)}`,
            Remaining: `$${parseFloat(cat.remaining || 0).toFixed(2)}`,
            'Usage %': `${parseFloat(cat.percentage || 0).toFixed(1)}%`,
            Status: parseFloat(cat.percentage) >= 100 ? 'Over Budget' : parseFloat(cat.percentage) >= 90 ? 'Near Limit' : 'On Track',
          }));
          break;

        case 'yearly-overview':
          filename = `Yearly_Overview_${currentYear}`;
          headers = ['Metric', 'Value', 'Year'];
          data = [
            { Metric: 'Total Income', Value: `$${(stats.monthlyIncome || 0).toFixed(2)}`, Year: currentYear },
            { Metric: 'Total Expenses', Value: `$${(stats.monthlyExpenses || 0).toFixed(2)}`, Year: currentYear },
            { Metric: 'Total Savings', Value: `$${(stats.totalSavings || 0).toFixed(2)}`, Year: currentYear },
            { Metric: 'Current Balance', Value: `$${(stats.currentBalance || 0).toFixed(2)}`, Year: currentYear },
          ];
          break;

        case 'transactions':
          filename = `All_Transactions_${currentMonth}`;
          headers = ['Type', 'Description', 'Category', 'Amount', 'Date', 'Status', 'Method'];
          data = transactions.map((tx: any) => ({
            Type: tx.type || 'expense',
            Description: tx.description || tx.category_name,
            Category: tx.category_name,
            Amount: `${tx.type === 'income' ? '+' : '-'}$${parseFloat(tx.amount).toFixed(2)}`,
            Date: new Date(tx.date).toLocaleDateString(),
            Status: tx.status || 'Completed',
            Method: tx.payment_method || 'N/A',
          }));
          break;
      }

      setModalData({ data, headers, filename });
      setShowModal(true);
    } catch (err) {
      console.error('Failed to generate report:', err);
      alert('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (modalData) {
      generateCSV(modalData.data, modalData.filename, modalData.headers);
    }
  };

  const reports = [
    { title: 'Monthly Summary', description: 'Overview of income, expenses, and savings', icon: Wallet, color: 'blue', type: 'monthly-summary' },
    { title: 'Category Breakdown', description: 'Spending analysis by category', icon: TrendingDown, color: 'red', type: 'category-breakdown' },
    { title: 'Income Report', description: 'Detailed income sources and earnings', icon: TrendingUp, color: 'green', type: 'income-report' },
    { title: 'Budget Performance', description: 'Budget vs actual spending analysis', icon: FileText, color: 'purple', type: 'budget-performance' },
    { title: 'Yearly Overview', description: 'Annual financial summary', icon: FileText, color: 'yellow', type: 'yearly-overview' },
    { title: 'All Transactions', description: 'Complete list of all expenses and income', icon: FileText, color: 'indigo', type: 'transactions' },
  ];

  const colorMap: any = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
    red: { bg: 'bg-red-50', icon: 'text-red-600' },
    green: { bg: 'bg-green-50', icon: 'text-green-600' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600' },
    yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600' },
    indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600' },
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Generate and download financial reports based on your data.</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-blue-800 text-sm">
          📅 Reports are generated for <strong>{new Date(currentMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong>
        </p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report, index) => {
          const colors = colorMap[report.color];
          return (
            <div
              key={index}
              onClick={() => handleReportClick(report.type, report.title)}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-4`}>
                <report.icon className={`w-6 h-6 ${colors.icon}`} />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">{report.title}</h3>
              <p className="text-gray-500 text-sm">{report.description}</p>
            </div>
          );
        })}
      </div>

      {/* Modal Popup */}
      {showModal && modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{modalTitle}</h2>
                <p className="text-sm text-gray-500 mt-1">{modalData.data.length} rows</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download CSV
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body - Table Preview */}
            <div className="flex-1 overflow-auto p-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {modalData.headers.map((header: string, i: number) => (
                      <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {modalData.data.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      {modalData.headers.map((header: string, j: number) => (
                        <td key={j} className="px-4 py-2 text-gray-700 whitespace-nowrap">
                          {row[header]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <p className="text-xs text-gray-500 text-center">
                Preview of report data • Click "Download CSV" to save the file
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;