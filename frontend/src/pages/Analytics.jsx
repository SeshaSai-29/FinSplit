import React, { useState, useEffect, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip, 
  Legend as RechartsLegend,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  Target, 
  PlusCircle, 
  Edit2, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  PieChart as PieChartIcon, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  ShieldCheck, 
  AlertTriangle, 
  Layers, 
  Activity, 
  ChevronRight
} from 'lucide-react';
import CategoryBudgetModal from '../components/CategoryBudgetModal';

export default function Analytics({ user }) {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [barHistoryWindow, setBarHistoryWindow] = useState('6M'); // '6M' | '12M'

  // Independent Month States for Savings Rate Card & Expenditure Pie Chart
  const now = new Date();
  const defaultMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [savingsMonth, setSavingsMonth] = useState(defaultMonthKey);
  const [expenditureMonth, setExpenditureMonth] = useState(defaultMonthKey);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategoryBudget, setSelectedCategoryBudget] = useState(null);

  // Active theme tracking for Recharts colors
  const [theme, setTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const active = document.documentElement.getAttribute('data-theme') || 'dark';
      setTheme(active);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
    return () => observer.disconnect();
  }, []);

  const fetchAnalytics = async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/transactions/analytics', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to load analytics data');
      }

      const data = await response.json();
      setAnalyticsData(data);
      if (data.currentMonth?.monthKey) {
        setSavingsMonth((prev) => prev || data.currentMonth.monthKey);
        setExpenditureMonth((prev) => prev || data.currentMonth.monthKey);
      }
    } catch (err) {
      console.error('Fetch analytics error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleOpenAddBudget = (categoryName = '', currentLimit = '') => {
    setSelectedCategoryBudget({
      category: categoryName,
      limit: currentLimit
    });
    setModalOpen(true);
  };

  const handleBudgetsUpdated = async (updatedBudgets, message) => {
    setSuccess(message || 'Category budgets updated successfully!');
    setTimeout(() => setSuccess(''), 4000);
    await fetchAnalytics();
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return num.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
  };

  const formatCompactCurrency = (val) => {
    const num = Number(val) || 0;
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(1)}L`;
    }
    if (num >= 1000) {
      return `₹${(num / 1000).toFixed(0)}k`;
    }
    return `₹${num}`;
  };

  // Theme-adaptive colors
  const isDark = theme === 'dark';

  const chartTheme = useMemo(() => {
    return {
      grid: isDark ? '#2A2F38' : '#CBD5E1',
      axisTicks: isDark ? '#9CA3AF' : '#64748B',
      tooltipBg: isDark ? '#1E222A' : '#FFFFFF',
      tooltipBorder: isDark ? '#2A2F38' : '#CBD5E1',
      tooltipText: isDark ? '#F8FAFC' : '#0F172A',
      tooltipMuted: isDark ? '#94A3B8' : '#64748B',
      incomeBar: '#22C55E',
      expenseBar: '#EF4444',
      donutColors: isDark
        ? ['#3B82F6', '#06B6D4', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899', '#6366F1', '#14B8A6']
        : ['#2563EB', '#0891B2', '#7C3AED', '#D97706', '#059669', '#DB2777', '#4F46E5', '#0D9488']
    };
  }, [isDark]);

  // Dropdown options for selecting any month from history
  const monthOptions = useMemo(() => {
    const list = analyticsData?.monthlyHistory || [];
    if (list.length === 0) {
      const d = new Date();
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return [{ value: key, label: d.toLocaleString('en-US', { month: 'long', year: 'numeric' }) }];
    }
    // Reverse to display newest month first in dropdown
    return [...list].reverse().map((m) => ({
      value: m.key,
      label: m.monthFull || m.label || m.key
    }));
  }, [analyticsData?.monthlyHistory]);

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <Loader2 size={40} style={{ color: 'var(--brand-primary)', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>Calculating financial metrics & charts...</p>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const current = analyticsData?.currentMonth || {};
  const prev = analyticsData?.previousMonth || {};
  const mom = analyticsData?.momChange || {};
  const trailing = analyticsData?.trailingAverages || {};
  const categoryBudgets = analyticsData?.categoryBudgets || [];
  const unbudgetedCategories = analyticsData?.unbudgetedCategories || [];
  const categoryBreakdown = analyticsData?.categoryBreakdown || [];
  const monthlyHistory = analyticsData?.monthlyHistory || [];

  // Savings Rate Card Data (independently driven by savingsMonth)
  const savingsMonthData = monthlyHistory.find((m) => m.key === savingsMonth) || (savingsMonth === current.monthKey ? current : { income: 0, expenses: 0, savings: 0, savingsRate: 0 });
  const savingsIncome = savingsMonthData.income || 0;
  const savingsExpenses = savingsMonthData.expenses !== undefined ? savingsMonthData.expenses : (savingsMonthData.expense || 0);
  const savingsAmount = savingsMonthData.savings !== undefined ? savingsMonthData.savings : (savingsIncome - savingsExpenses);
  const savingsRateVal = savingsMonthData.savingsRate !== undefined ? savingsMonthData.savingsRate : (savingsIncome > 0 ? (savingsAmount / savingsIncome) * 100 : 0);
  const isSavingsPositive = savingsAmount >= 0;

  // Overall Budget metrics
  const overallMonthlyLimit = current.overallMonthlyLimit || user?.monthlyBudgetLimit || 0;
  const totalMonthExpenses = current.expenses || 0;
  const overallUtilization = overallMonthlyLimit > 0 ? (totalMonthExpenses / overallMonthlyLimit) * 100 : 0;
  const isOverallOver = overallMonthlyLimit > 0 && totalMonthExpenses > overallMonthlyLimit;
  const overallRemaining = Math.max(0, overallMonthlyLimit - totalMonthExpenses);
  const overallOverAmount = isOverallOver ? totalMonthExpenses - overallMonthlyLimit : 0;

  let overallBarColor = '#22C55E';
  if (isOverallOver || overallUtilization > 90) {
    overallBarColor = '#EF4444';
  } else if (overallUtilization >= 70) {
    overallBarColor = '#F59E0B';
  }

  // Filter bar chart window
  const barChartData = barHistoryWindow === '6M' ? monthlyHistory.slice(-6) : monthlyHistory;

  // Expenditure Categorization Data (independently driven by expenditureMonth)
  const expenditureMonthBreakdown = (analyticsData?.monthlyCategoryBreakdowns && analyticsData.monthlyCategoryBreakdowns[expenditureMonth])
    ? analyticsData.monthlyCategoryBreakdowns[expenditureMonth]
    : (expenditureMonth === current.monthKey ? categoryBreakdown : []);

  const pieData = expenditureMonthBreakdown.map((item) => ({
    name: item.category,
    value: item.amount || item.spent || 0,
    percentage: item.percentage || 0,
    count: item.count || 0
  }));

  const totalPieSpend = pieData.reduce((sum, item) => sum + item.value, 0);
  const expenditureMonthLabel = monthOptions.find((o) => o.value === expenditureMonth)?.label || expenditureMonth;

  // Custom Tooltip for Pie Chart
  const PieCustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: chartTheme.tooltipBg,
            border: `1px solid ${chartTheme.tooltipBorder}`,
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.35), 0 8px 10px -6px rgba(0, 0, 0, 0.35)',
            opacity: 1,
            color: chartTheme.tooltipText,
            minWidth: '160px',
            pointerEvents: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: payload[0].payload.fill || '#3B82F6',
                display: 'inline-block'
              }}
            />
            <span style={{ fontWeight: 700, fontFamily: 'var(--font-heading)', fontSize: '0.95rem' }}>
              {data.name}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: chartTheme.tooltipMuted }}>Spent:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.95rem', fontVariantNumeric: 'tabular-nums', color: '#EF4444' }}>
              {formatCurrency(data.value)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem', marginTop: '0.2rem' }}>
            <span style={{ fontSize: '0.8rem', color: chartTheme.tooltipMuted }}>Share of spend:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', fontVariantNumeric: 'tabular-nums', color: chartTheme.tooltipText }}>
              {data.percentage.toFixed(1)}%
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Grouped Bar Chart
  const BarCustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const incomeItem = payload.find((p) => p.dataKey === 'income');
      const expenseItem = payload.find((p) => p.dataKey === 'expense' || p.dataKey === 'expenses');
      const incomeVal = incomeItem ? Number(incomeItem.value) : 0;
      const expenseVal = expenseItem ? Number(expenseItem.value) : 0;
      const netSavings = incomeVal - expenseVal;
      const rate = incomeVal > 0 ? ((netSavings / incomeVal) * 100).toFixed(1) : 0;

      const rawItem = payload[0].payload;
      const displayMonth = rawItem.monthFull || label;

      return (
        <div
          style={{
            backgroundColor: chartTheme.tooltipBg,
            border: `1px solid ${chartTheme.tooltipBorder}`,
            borderRadius: '8px',
            padding: '0.85rem 1.1rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.35), 0 8px 10px -6px rgba(0, 0, 0, 0.35)',
            opacity: 1,
            color: chartTheme.tooltipText,
            minWidth: '190px',
            pointerEvents: 'none'
          }}
        >
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 700, fontFamily: 'var(--font-heading)', fontSize: '0.95rem', borderBottom: `1px solid ${chartTheme.tooltipBorder}`, paddingBottom: '0.35rem' }}>
            {displayMonth}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.3rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: chartTheme.tooltipMuted }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#22C55E' }} /> Income:
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem', fontVariantNumeric: 'tabular-nums', color: '#22C55E' }}>
              {formatCurrency(incomeVal)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.4rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: chartTheme.tooltipMuted }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#EF4444' }} /> Expenses:
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem', fontVariantNumeric: 'tabular-nums', color: '#EF4444' }}>
              {formatCurrency(expenseVal)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', borderTop: `1px dashed ${chartTheme.tooltipBorder}`, paddingTop: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: chartTheme.tooltipMuted }}>Net Savings:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem', fontVariantNumeric: 'tabular-nums', color: netSavings >= 0 ? '#00ADB5' : '#EF4444' }}>
              {formatCurrency(netSavings)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginTop: '0.2rem' }}>
            <span style={{ fontSize: '0.75rem', color: chartTheme.tooltipMuted }}>Savings Rate:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums', color: rate >= 20 ? '#22C55E' : '#94A3B8' }}>
              {rate}%
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="page-container">
      {/* ========================================================
          PAGE HEADER
          ======================================================== */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontFamily: 'var(--font-heading)', fontWeight: 800 }}>
          <BarChart3 size={32} style={{ color: 'var(--brand-primary)' }} />
          <span>Financial Analytics & Insights</span>
        </h1>
        <p className="page-subtitle" style={{ fontFamily: 'var(--font-body)' }}>
          Interactive visualizations, trailing spend averages, MoM trend curves, and category budget ceilings.
        </p>
      </div>

      {/* Alert Banners */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* ========================================================
          TOP ROW: SAVINGS RATE (%) & TRAILING SPEND AVERAGES
          ======================================================== */}
      <div className="analytics-top-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* CARD 1: SAVINGS RATE & MONTHLY OVERVIEW */}
        <div className="solid-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.95rem', fontFamily: 'var(--font-heading)' }}>
                <ShieldCheck size={18} style={{ color: 'var(--brand-primary)' }} />
                <span>Current Savings Rate</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={14} style={{ color: 'var(--brand-primary)' }} />
                <select
                  value={savingsMonth}
                  onChange={(e) => setSavingsMonth(e.target.value)}
                  className="form-input form-select"
                  style={{
                    padding: '0.2rem 0.6rem',
                    fontSize: '0.8rem',
                    borderRadius: '6px',
                    height: '30px',
                    width: 'auto',
                    minWidth: '135px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  id="savings-rate-month-select"
                  title="Change active savings rate month"
                >
                  {monthOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{
                fontSize: '2.8rem',
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                color: savingsRateVal >= 20 ? '#22C55E' : savingsRateVal > 0 ? 'var(--brand-primary)' : '#EF4444',
                lineHeight: 1
              }}>
                {savingsRateVal.toFixed(1)}%
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500, fontFamily: 'var(--font-body)' }}>
                of income saved
              </span>
            </div>

            {/* Savings Rate Progress Meter */}
            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '4px', overflow: 'hidden', marginBottom: '1.25rem' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.max(0, savingsRateVal))}%`,
                  backgroundColor: savingsRateVal >= 20 ? '#22C55E' : savingsRateVal > 0 ? 'var(--brand-primary)' : '#EF4444',
                  borderRadius: '4px',
                  transition: 'width 0.5s ease'
                }}
              />
            </div>
          </div>

          {/* Income vs Expense vs Net Saved breakdown */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '0.75rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color)',
            fontSize: '0.85rem'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', marginBottom: '0.2rem', fontFamily: 'var(--font-body)' }}>Total Income</span>
              <span style={{ fontWeight: 700, color: '#22C55E', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(savingsIncome)}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', marginBottom: '0.2rem', fontFamily: 'var(--font-body)' }}>Total Spend</span>
              <span style={{ fontWeight: 700, color: '#EF4444', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(savingsExpenses)}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', marginBottom: '0.2rem', fontFamily: 'var(--font-body)' }}>Net Saved</span>
              <span style={{ fontWeight: 700, color: isSavingsPositive ? 'var(--brand-primary)' : '#EF4444', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(savingsAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: TRAILING SPEND AVERAGES (3M / 6M / 12M) */}
        <div className="solid-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.95rem', fontFamily: 'var(--font-heading)' }}>
                <Calendar size={18} style={{ color: 'var(--brand-primary)' }} />
                <span>Trailing Monthly Spend Averages</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Historical Windows</span>
            </div>

            {/* 3M / 6M / 12M Average Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* 3 Months */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px', backgroundColor: 'var(--brand-primary-subtle)', color: 'var(--brand-primary)' }}>
                    3M
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>3-Month Average</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(trailing.threeMonths?.avgMonthlySpend)}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>/ month</span>
                </div>
              </div>

              {/* 6 Months */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px', backgroundColor: 'var(--color-secondary-subtle)', color: 'var(--color-secondary)' }}>
                    6M
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>6-Month Average</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(trailing.sixMonths?.avgMonthlySpend)}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>/ month</span>
                </div>
              </div>

              {/* 12 Months */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px', backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}>
                    12M
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>12-Month Average</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(trailing.twelveMonths?.avgMonthlySpend)}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>/ month</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)' }}>
            <span>3M Total: {formatCurrency(trailing.threeMonths?.totalSpend)}</span>
            <span>12M Total: {formatCurrency(trailing.twelveMonths?.totalSpend)}</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          MIDDLE ROW: INTERACTIVE CHARTS SECTION (2-COLUMN GRID)
          ======================================================== */}
      <div className="analytics-charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* CHART 1: EXPENDITURE PIE CHART */}
        <div className="solid-card" style={{ padding: '1.75rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PieChartIcon size={20} style={{ color: 'var(--brand-primary)' }} />
                <span>Expenditure Categorization</span>
              </h2>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                {expenditureMonthLabel} active expense distribution
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={14} style={{ color: 'var(--brand-primary)' }} />
                <select
                  value={expenditureMonth}
                  onChange={(e) => setExpenditureMonth(e.target.value)}
                  className="form-input form-select"
                  style={{
                    padding: '0.2rem 0.6rem',
                    fontSize: '0.8rem',
                    borderRadius: '6px',
                    height: '30px',
                    width: 'auto',
                    minWidth: '135px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  id="expenditure-month-select"
                  title="Change expenditure distribution month"
                >
                  {monthOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Monthly Total</span>
                <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '1.05rem', color: '#EF4444', fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(totalPieSpend)}
                </span>
              </div>
            </div>
          </div>

          {pieData.length === 0 ? (
            <div className="empty-state" style={{ padding: '3.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <PieChartIcon size={44} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: '0.75rem' }} />
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>No Expenses Recorded This Month</p>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Log your transactions to populate expenditure categorization.
              </span>
            </div>
          ) : (
            <div style={{ width: '100%', height: 320, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={105}
                    paddingAngle={0}
                    dataKey="value"
                    nameKey="name"
                    stroke={isDark ? '#1E222A' : '#FFFFFF'}
                    strokeWidth={2}
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${entry.name}`} 
                        fill={chartTheme.donutColors[index % chartTheme.donutColors.length]} 
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<PieCustomTooltip />} />
                  <RechartsLegend 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{
                      paddingTop: '12px',
                      fontSize: '0.8rem',
                      fontFamily: 'var(--font-body)',
                      color: chartTheme.axisTicks
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* CHART 2: GROUPED BAR CHART (INCOME VS EXPENDITURE HISTORICAL) */}
        <div className="solid-card" style={{ padding: '1.75rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={20} style={{ color: '#22C55E' }} />
                <span>Monthly Income vs. Expenditure</span>
              </h2>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                Trailing month-by-month financial trajectory
              </p>
            </div>

            {/* 6M vs 12M Window Selector */}
            <div style={{ display: 'flex', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => setBarHistoryWindow('6M')}
                style={{
                  padding: '0.25rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: barHistoryWindow === '6M' ? 'var(--brand-primary)' : 'transparent',
                  color: barHistoryWindow === '6M' ? '#FFFFFF' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                6M
              </button>
              <button
                type="button"
                onClick={() => setBarHistoryWindow('12M')}
                style={{
                  padding: '0.25rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: barHistoryWindow === '12M' ? 'var(--brand-primary)' : 'transparent',
                  color: barHistoryWindow === '12M' ? '#FFFFFF' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                12M
              </button>
            </div>
          </div>

          {barChartData.length === 0 ? (
            <div className="empty-state" style={{ padding: '3.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <Activity size={44} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: '0.75rem' }} />
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>No Historical Activity</p>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Add personal transactions across months to generate trend comparisons.
              </span>
            </div>
          ) : (
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barChartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  barGap={4}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                  <XAxis 
                    dataKey="month" 
                    tickLine={false} 
                    axisLine={{ stroke: chartTheme.grid }}
                    tick={{ fill: chartTheme.axisTicks, fontSize: 12, fontFamily: 'var(--font-body)' }}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={{ stroke: chartTheme.grid }}
                    tickFormatter={formatCompactCurrency}
                    tick={{ fill: chartTheme.axisTicks, fontSize: 11, fontFamily: 'var(--font-mono)' }}
                  />
                  <RechartsTooltip content={<BarCustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />
                  <RechartsLegend 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{
                      paddingTop: '12px',
                      fontSize: '0.8rem',
                      fontFamily: 'var(--font-body)',
                      color: chartTheme.axisTicks
                    }}
                  />
                  <Bar 
                    dataKey="income" 
                    name="Total Income" 
                    fill={chartTheme.incomeBar} 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={32}
                  />
                  <Bar 
                    dataKey="expense" 
                    name="Total Expenses" 
                    fill={chartTheme.expenseBar} 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          MIDDLE-ROW COMPONENT: MoM SUMMARY CARDS
          ======================================================== */}
      <div className="analytics-mom-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* MoM Spending Chip */}
        <div className="solid-card" style={{ padding: '1.25rem 1.5rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem', fontFamily: 'var(--font-body)' }}>
              Month-over-Month Spending
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(current.expenses)}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                vs {formatCurrency(prev.expenses)} last mo.
              </span>
            </div>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.4rem 0.8rem',
            borderRadius: '20px',
            backgroundColor: mom.isSpendingUp ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
            border: `1px solid ${mom.isSpendingUp ? 'rgba(239, 68, 68, 0.35)' : 'rgba(34, 197, 94, 0.35)'}`,
            color: mom.isSpendingUp ? '#EF4444' : '#22C55E',
            fontWeight: 700,
            fontSize: '0.88rem',
            fontFamily: 'var(--font-mono)',
            fontVariantNumeric: 'tabular-nums'
          }}>
            {mom.isSpendingUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span>{mom.spendingChangePercent > 0 ? `+${mom.spendingChangePercent}%` : `${mom.spendingChangePercent}%`}</span>
          </div>
        </div>

        {/* MoM Income Chip */}
        <div className="solid-card" style={{ padding: '1.25rem 1.5rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem', fontFamily: 'var(--font-body)' }}>
              Month-over-Month Income
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(current.income)}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                vs {formatCurrency(prev.income)} last mo.
              </span>
            </div>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.4rem 0.8rem',
            borderRadius: '20px',
            backgroundColor: mom.incomeChangePercent >= 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${mom.incomeChangePercent >= 0 ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
            color: mom.incomeChangePercent >= 0 ? '#22C55E' : '#EF4444',
            fontWeight: 700,
            fontSize: '0.88rem',
            fontFamily: 'var(--font-mono)',
            fontVariantNumeric: 'tabular-nums'
          }}>
            {mom.incomeChangePercent >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span>{mom.incomeChangePercent > 0 ? `+${mom.incomeChangePercent}%` : `${mom.incomeChangePercent}%`}</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          BOTTOM SECTION: OVERALL & CATEGORY BUDGET UTILIZATION
          ======================================================== */}
      <div className="solid-card" style={{ padding: '2rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target size={22} style={{ color: 'var(--brand-primary)' }} />
              <span>Budget Utilization & Limits</span>
            </h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
              Live current month spending tracked against overall and category ceilings.
            </p>
          </div>

          <button
            onClick={() => handleOpenAddBudget()}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            <PlusCircle size={15} />
            <span>Add Category Limit</span>
          </button>
        </div>

        {/* OVERALL BUDGET UTILIZATION CARD */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            border: isOverallOver ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem'
          }}
          id="overall-budget-utilization-card"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--brand-primary-subtle)',
                  border: '1px solid var(--brand-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--brand-primary)'
                }}
              >
                <Target size={16} />
              </div>
              <div>
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                  Overall Monthly Budget
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>
                  {current.monthName || 'Current Month'} total spend vs overall monthly limit
                </span>
              </div>
            </div>

            {overallMonthlyLimit > 0 ? (
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '12px',
                  backgroundColor: isOverallOver ? 'rgba(239, 68, 68, 0.15)' : overallUtilization >= 70 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                  color: overallBarColor,
                  fontFamily: 'var(--font-mono)',
                  fontVariantNumeric: 'tabular-nums'
                }}
              >
                {overallUtilization.toFixed(0)}% Utilized
              </span>
            ) : (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                No Overall Limit Set
              </span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: isOverallOver ? '#EF4444' : 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(totalMonthExpenses)}
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {' '} / {overallMonthlyLimit > 0 ? formatCurrency(overallMonthlyLimit) : '₹0.00 (Unset)'}
              </span>
            </div>
            {overallMonthlyLimit > 0 && (
              <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: isOverallOver ? '#EF4444' : 'var(--text-muted)' }}>
                {isOverallOver ? `Over budget by ${formatCurrency(overallOverAmount)}` : `${formatCurrency(overallRemaining)} remaining`}
              </span>
            )}
          </div>

          {overallMonthlyLimit > 0 ? (
            <div
              style={{
                width: '100%',
                height: '10px',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '5px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, overallUtilization)}%`,
                  backgroundColor: overallBarColor,
                  borderRadius: '5px',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
          ) : (
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Tip: You can configure your overall monthly budget limit in your Profile Settings to track total personal spend.
            </p>
          )}
        </div>

        {/* Section divider for Category Budgets */}
        <div style={{ marginBottom: '1rem', marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>
            Category Budget Breakdown
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {categoryBudgets.length} {categoryBudgets.length === 1 ? 'Category' : 'Categories'} Tracked
          </span>
        </div>

        {/* Category Budget Cards List */}
        {categoryBudgets.length === 0 ? (
          <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
            <Target size={48} className="empty-icon" style={{ color: 'var(--brand-primary)', opacity: 0.8 }} />
            <p style={{ fontWeight: 600, fontSize: '1.05rem', marginTop: '0.75rem', color: 'var(--text-primary)' }}>No Category Budgets Configured</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0.25rem 0 1.25rem' }}>
              Set individual monthly budget targets for categories like Food, Rent, Transport, or Shopping to prevent overspending.
            </p>
            <button
              onClick={() => handleOpenAddBudget()}
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem' }}
            >
              <PlusCircle size={16} />
              <span>Create First Category Budget</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {categoryBudgets.map((cb, index) => {
              const util = cb.utilization || 0;
              let barColor = '#22C55E'; // Green (< 70%)
              if (cb.isOverBudget || util > 90) {
                barColor = '#EF4444'; // Red (> 90% or exceeded)
              } else if (util >= 70) {
                barColor = '#F59E0B'; // Amber (70% - 90%)
              }

              return (
                <div
                  key={cb.category}
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    border: cb.isOverBudget ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  id={`category-budget-${cb.category.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div>
                    {/* Card Header: Category Name & Edit Button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: chartTheme.donutColors[index % chartTheme.donutColors.length],
                          display: 'inline-block'
                        }} />
                        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                          {cb.category}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenAddBudget(cb.category, cb.limit)}
                        title={`Edit ${cb.category} Budget`}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '0.3rem',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'color 0.2s'
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.color = 'var(--brand-primary)')}
                        onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>

                    {/* Spend vs Limit Values */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: cb.isOverBudget ? '#EF4444' : 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                          {formatCurrency(cb.spent)}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {' '} / {formatCurrency(cb.limit)}
                        </span>
                      </div>

                      {/* Utilization % badge */}
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '12px',
                        backgroundColor: cb.isOverBudget ? 'rgba(239, 68, 68, 0.15)' : util >= 70 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                        color: barColor,
                        fontFamily: 'var(--font-mono)',
                        fontVariantNumeric: 'tabular-nums'
                      }}>
                        {util.toFixed(0)}%
                      </span>
                    </div>

                    {/* Solid Progress Meter */}
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      marginBottom: '0.75rem'
                    }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(100, util)}%`,
                          backgroundColor: barColor,
                          borderRadius: '4px',
                          transition: 'width 0.4s ease'
                        }}
                      />
                    </div>
                  </div>

                  {/* Footer status pill */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                    {cb.isOverBudget ? (
                      <span style={{ color: '#EF4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-body)' }}>
                        <AlertTriangle size={13} />
                        Exceeded by {formatCurrency(cb.overAmount)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                        {formatCurrency(cb.remaining)} remaining
                      </span>
                    )}

                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                      Monthly target
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* UNBUDGETED CATEGORIES PROMPT (If any unbudgeted categories had spending this month) */}
        {unbudgetedCategories.length > 0 && (
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-heading)' }}>
              <AlertTriangle size={16} style={{ color: 'var(--brand-primary)' }} />
              <span>Unbudgeted Spending This Month</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', fontFamily: 'var(--font-body)' }}>
              You spent in these categories without a preset limit. Click any category to set a target limit:
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              {unbudgetedCategories.map((ub) => (
                <div
                  key={ub.category}
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '0.4rem 0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    fontSize: '0.82rem'
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>{ub.category}:</span>
                  <span style={{ color: '#EF4444', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{formatCurrency(ub.spent)}</span>
                  <button
                    type="button"
                    onClick={() => handleOpenAddBudget(ub.category, Math.ceil(ub.spent / 1000) * 1000 || 5000)}
                    style={{
                      background: 'var(--brand-primary-subtle)',
                      border: '1px solid var(--brand-primary)',
                      color: 'var(--brand-primary)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}
                  >
                    <PlusCircle size={11} />
                    <span>Set Limit</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Category Budget Modal */}
      {modalOpen && (
        <CategoryBudgetModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedCategoryBudget(null);
          }}
          initialCategory={selectedCategoryBudget?.category || ''}
          initialLimit={selectedCategoryBudget?.limit || ''}
          existingBudgets={categoryBudgets}
          onBudgetsUpdated={handleBudgetsUpdated}
        />
      )}
    </div>
  );
}
