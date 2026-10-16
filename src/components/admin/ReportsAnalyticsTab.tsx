import React, { useState, useMemo } from 'react';
import { useScrap } from '../../context/ScrapContext';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  TrendingUp,
  Scale,
  Coins,
  Truck,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  BarChart3,
  PieChart,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { jsPDF } from 'jspdf';

export const ReportsAnalyticsTab: React.FC = () => {
  const { bookings, payouts, categories, currentAdmin } = useScrap();

  // Filter States
  const [timeRange, setTimeRange] = useState<'all' | 'today' | '7days' | '30days' | 'this_month' | 'custom'>('30days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Export Loading Feedback
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const showToast = (type: 'success' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Date Filtering Logic
  const filteredBookings = useMemo(() => {
    const now = new Date();
    return bookings.filter((b) => {
      const bDate = new Date(b.created_at || b.preferred_date);

      // Date Range Check
      let passesDate = true;
      if (timeRange === 'today') {
        passesDate = bDate.toDateString() === now.toDateString();
      } else if (timeRange === '7days') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        passesDate = bDate >= sevenDaysAgo;
      } else if (timeRange === '30days') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        passesDate = bDate >= thirtyDaysAgo;
      } else if (timeRange === 'this_month') {
        passesDate = bDate.getMonth() === now.getMonth() && bDate.getFullYear() === now.getFullYear();
      } else if (timeRange === 'custom') {
        if (customStartDate) {
          passesDate = passesDate && bDate >= new Date(customStartDate);
        }
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          passesDate = passesDate && bDate <= end;
        }
      }

      // Category Filter Check
      let passesCategory = true;
      if (categoryFilter !== 'all') {
        passesCategory = b.category_ids?.includes(categoryFilter) || false;
      }

      // Status Filter Check
      let passesStatus = true;
      if (statusFilter !== 'all') {
        passesStatus = b.status === statusFilter;
      }

      return passesDate && passesCategory && passesStatus;
    });
  }, [bookings, timeRange, customStartDate, customEndDate, categoryFilter, statusFilter]);

  // Analytics Computation
  const completedBookings = useMemo(() => filteredBookings.filter((b) => b.status === 'completed'), [filteredBookings]);
  const pendingBookings = useMemo(() => filteredBookings.filter((b) => b.status === 'pending' || b.status === 'assigned' || b.status === 'on_the_way'), [filteredBookings]);
  const cancelledBookings = useMemo(() => filteredBookings.filter((b) => b.status === 'cancelled'), [filteredBookings]);

  const totalRevenueDisbursed = useMemo(() => {
    return completedBookings.reduce((sum, b) => sum + (b.final_amount || 0), 0);
  }, [completedBookings]);

  const totalScrapWeightKg = useMemo(() => {
    return completedBookings.reduce((sum, b) => sum + (b.final_weight_kg || 0), 0);
  }, [completedBookings]);

  const completionRatePct = useMemo(() => {
    if (filteredBookings.length === 0) return 0;
    return Math.round((completedBookings.length / filteredBookings.length) * 100);
  }, [filteredBookings, completedBookings]);

  const avgOrderValue = useMemo(() => {
    if (completedBookings.length === 0) return 0;
    return Math.round(totalRevenueDisbursed / completedBookings.length);
  }, [completedBookings, totalRevenueDisbursed]);

  const uniqueCustomersCount = useMemo(() => {
    const phones = new Set(filteredBookings.map((b) => b.customer_phone));
    return phones.size;
  }, [filteredBookings]);

  // Category breakdown calculation
  const categoryStats = useMemo(() => {
    const statsMap: Record<string, { name: string; weight: number; revenue: number; count: number }> = {};

    categories.forEach((cat) => {
      statsMap[cat.id] = { name: cat.name, weight: 0, revenue: 0, count: 0 };
    });

    completedBookings.forEach((booking) => {
      if (booking.items_collected && booking.items_collected.length > 0) {
        booking.items_collected.forEach((item) => {
          if (!statsMap[item.category_id]) {
            statsMap[item.category_id] = { name: item.category_name, weight: 0, revenue: 0, count: 0 };
          }
          statsMap[item.category_id].weight += item.weight_kg;
          statsMap[item.category_id].revenue += item.subtotal;
          statsMap[item.category_id].count += 1;
        });
      } else if (booking.category_ids) {
        // Fallback for bookings with estimated values
        booking.category_ids.forEach((catId) => {
          if (statsMap[catId]) {
            statsMap[catId].weight += (booking.final_weight_kg || booking.estimated_weight_kg || 0) / (booking.category_ids.length || 1);
            statsMap[catId].revenue += (booking.final_amount || 0) / (booking.category_ids.length || 1);
            statsMap[catId].count += 1;
          }
        });
      }
    });

    return Object.values(statsMap).sort((a, b) => b.revenue - a.revenue);
  }, [categories, completedBookings]);

  // CSV EXPORT GENERATOR
  const handleExportCSV = () => {
    setExportingCSV(true);
    setTimeout(() => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const timeFilterLabel = timeRange.toUpperCase().replace('_', ' ');

        let csvContent = '\uFEFF'; // UTF-8 BOM

        // Header Section
        csvContent += `SCRAPHOUSE BUSINESS ANALYTICS & OPERATIONS REPORT\n`;
        csvContent += `Generated On:,${new Date().toLocaleString('en-IN')}\n`;
        csvContent += `Generated By:,${currentAdmin.name} (${currentAdmin.adminRole})\n`;
        csvContent += `Time Period Filter:,${timeFilterLabel}\n`;
        csvContent += `Status Filter:,${statusFilter.toUpperCase()}\n`;
        csvContent += `\n`;

        // Executive Summary KPI Section
        csvContent += `EXECUTIVE SUMMARY METRICS\n`;
        csvContent += `Metric Name,Value,Unit\n`;
        csvContent += `Total Bookings,${filteredBookings.length},Bookings\n`;
        csvContent += `Completed Pickups,${completedBookings.length},Pickups\n`;
        csvContent += `Completion Rate,${completionRatePct}%\n`;
        csvContent += `Total Revenue Disbursed,₹${totalRevenueDisbursed},INR\n`;
        csvContent += `Total Scrap Collected,${totalScrapWeightKg.toFixed(2)},KG\n`;
        csvContent += `Average Order Value,₹${avgOrderValue},INR/Pickup\n`;
        csvContent += `Unique Active Customers,${uniqueCustomersCount},Customers\n`;
        csvContent += `\n`;

        // Scrap Category Breakdown Section
        csvContent += `SCRAP CATEGORY PERFORMANCE BREAKDOWN\n`;
        csvContent += `Category Name,Weight Collected (KG),Total Disbursed (INR),Order Count,% of Weight\n`;
        categoryStats.forEach((cat) => {
          const pct = totalScrapWeightKg > 0 ? ((cat.weight / totalScrapWeightKg) * 100).toFixed(1) : '0';
          csvContent += `"${cat.name}",${cat.weight.toFixed(2)},${cat.revenue.toFixed(2)},${cat.count},${pct}%\n`;
        });
        csvContent += `\n`;

        // Detailed Transactions Ledger Section
        csvContent += `DETAILED PICKUP BOOKINGS LEDGER\n`;
        csvContent += `Booking ID,Customer Name,Phone Number,Pickup Address,Date,Time Slot,Status,Weight (KG),Amount Paid (INR),Payment Method,UPI/Bank Details,Assigned Driver\n`;

        filteredBookings.forEach((b) => {
          const addrClean = (b.pickup_address || '').replace(/"/g, '""');
          const nameClean = (b.customer_name || '').replace(/"/g, '""');
          const driverClean = (b.staff_name || 'Unassigned').replace(/"/g, '""');
          const payDest = b.payout_method === 'upi' ? (b.upi_id || 'N/A') : b.payout_method === 'bank_transfer' ? (b.bank_details?.account_number || 'N/A') : 'Cash on Spot';

          csvContent += `"${b.booking_number}","${nameClean}","${b.customer_phone}","${addrClean}","${b.preferred_date}","${b.preferred_time_slot}","${b.status.toUpperCase()}",${b.final_weight_kg || b.estimated_weight_kg || 0},${b.final_amount || 0},"${b.payout_method.toUpperCase()}","${payDest}","${driverClean}"\n`;
        });

        // Trigger Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `ScrapHouse_Analytics_Report_${todayStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast('success', 'CSV Analytics Report downloaded successfully!');
      } catch (err) {
        console.error('CSV Export Error:', err);
        showToast('info', 'Error generating CSV file.');
      } finally {
        setExportingCSV(false);
      }
    }, 400);
  };

  // PDF EXPORT GENERATOR
  const handleExportPDF = () => {
    setExportingPDF(true);
    setTimeout(() => {
      try {
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const todayStr = new Date().toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
        const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        // Colors
        const darkGreen = '#064E3B'; // Emerald 900
        const accentGreen = '#059669'; // Emerald 600
        const slateBg = '#F8FAFC';
        const textColor = '#1E293B';

        // Header Banner Box
        doc.setFillColor(6, 78, 59); // Dark Green
        doc.rect(0, 0, 210, 32, 'F');

        // Brand Title
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text('ScrapHouse', 14, 15);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Doorstep Scrap Pickup Business Analytics Report', 14, 22);

        doc.setFontSize(8);
        doc.text(`Generated: ${todayStr} ${timeStr}`, 145, 15);
        doc.text(`By Admin: ${currentAdmin.name}`, 145, 21);

        let y = 40;

        // Executive Summary Box Title
        doc.setTextColor(6, 78, 59);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('1. EXECUTIVE SUMMARY & KPIS', 14, y);
        y += 6;

        // KPI Summary Box Background
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(14, y, 182, 38, 2, 2, 'FD');

        // KPI Grid - Row 1
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);

        // Col 1: Total Revenue
        doc.text('Total Revenue Disbursed', 20, y + 8);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(5, 150, 105);
        doc.text(`Rs. ${totalRevenueDisbursed.toLocaleString('en-IN')}`, 20, y + 16);

        // Col 2: Total Weight
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Scrap Collected', 80, y + 8);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text(`${totalScrapWeightKg.toFixed(1)} KG`, 80, y + 16);

        // Col 3: Completion Rate
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Completion Rate', 140, y + 8);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text(`${completionRatePct}% (${completedBookings.length}/${filteredBookings.length})`, 140, y + 16);

        // KPI Grid - Row 2
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Average Order Value (AOV)', 20, y + 26);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.text(`Rs. ${avgOrderValue} / pickup`, 20, y + 33);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Active Customers', 80, y + 26);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.text(`${uniqueCustomersCount} Customers`, 80, y + 33);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Pending / In-Progress', 140, y + 26);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(217, 119, 6); // Amber
        doc.text(`${pendingBookings.length} Pickups`, 140, y + 33);

        y += 46;

        // Category Breakdown Section
        doc.setTextColor(6, 78, 59);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('2. SCRAP CATEGORY BREAKDOWN', 14, y);
        y += 6;

        // Category Table Header
        doc.setFillColor(6, 78, 59);
        doc.rect(14, y, 182, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('CATEGORY NAME', 18, y + 5);
        doc.text('WEIGHT (KG)', 80, y + 5);
        doc.text('TOTAL PAID (RS.)', 120, y + 5);
        doc.text('% SHARE OF TOTAL', 160, y + 5);
        y += 7;

        // Category Table Rows
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);
        categoryStats.slice(0, 6).forEach((cat, idx) => {
          if (idx % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(14, y, 182, 6.5, 'F');
          }
          const pct = totalScrapWeightKg > 0 ? ((cat.weight / totalScrapWeightKg) * 100).toFixed(1) : '0';

          doc.text(cat.name, 18, y + 4.5);
          doc.text(`${cat.weight.toFixed(1)} kg`, 80, y + 4.5);
          doc.text(`Rs. ${cat.revenue.toLocaleString('en-IN')}`, 120, y + 4.5);
          doc.text(`${pct}%`, 160, y + 4.5);
          y += 6.5;
        });

        y += 8;

        // Recent Bookings Ledger Section
        doc.setTextColor(6, 78, 59);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('3. PICKUP TRANSACTIONS LEDGER (RECENT 10)', 14, y);
        y += 6;

        // Transactions Table Header
        doc.setFillColor(30, 41, 59);
        doc.rect(14, y, 182, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('BOOKING ID', 18, y + 5);
        doc.text('CUSTOMER', 50, y + 5);
        doc.text('DATE', 95, y + 5);
        doc.text('STATUS', 125, y + 5);
        doc.text('WEIGHT', 155, y + 5);
        doc.text('AMOUNT', 178, y + 5);
        y += 7;

        // Table Rows
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);

        filteredBookings.slice(0, 10).forEach((b, idx) => {
          if (idx % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(14, y, 182, 6.5, 'F');
          }

          const cName = b.customer_name.length > 18 ? b.customer_name.substring(0, 16) + '..' : b.customer_name;
          const wt = b.final_weight_kg ? `${b.final_weight_kg} kg` : `${b.estimated_weight_kg || 0} kg (est)`;
          const amt = b.final_amount ? `Rs. ${b.final_amount}` : 'Pending';

          doc.text(b.booking_number, 18, y + 4.5);
          doc.text(cName, 50, y + 4.5);
          doc.text(b.preferred_date, 95, y + 4.5);
          doc.text(b.status.toUpperCase(), 125, y + 4.5);
          doc.text(wt, 155, y + 4.5);
          doc.text(amt, 178, y + 4.5);
          y += 6.5;
        });

        // PDF Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.setDrawColor(226, 232, 240);
          doc.line(14, 280, 196, 280);
          doc.text('ScrapHouse Business Analytics System — Confidential Executive Document', 14, 286);
          doc.text(`Page ${i} of ${pageCount}`, 180, 286);
        }

        // Save PDF
        doc.save(`ScrapHouse_Analytics_Report_${todayStr.replace(/\s+/g, '_')}.pdf`);
        showToast('success', 'PDF Analytics Report generated and downloaded!');
      } catch (err) {
        console.error('PDF Export Error:', err);
        showToast('info', 'Error generating PDF report.');
      } finally {
        setExportingPDF(false);
      }
    }, 400);
  };

  // PRINT REPORT VIEW
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between border shadow-xs animate-in fade-in ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-blue-50 text-blue-900 border-blue-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {toastMessage.text}
          </span>
          <button onClick={() => setToastMessage(null)} className="text-xs opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Header & Main Export Actions Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                Business Analytics & Reports
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Download comprehensive revenue, scrap weight, and operational metrics for business audit.
              </p>
            </div>
          </div>
        </div>

        {/* EXPORT ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={handleExportCSV}
            disabled={exportingCSV}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{exportingCSV ? 'Preparing CSV...' : 'Export CSV Data'}</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={exportingPDF}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{exportingPDF ? 'Generating PDF...' : 'Download PDF Report'}</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            title="Print or Save as PDF"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            Report Filters & Date Range
          </span>
          <span className="text-[11px] text-slate-500">
            Showing <strong className="text-slate-900 dark:text-white">{filteredBookings.length}</strong> matching pickup bookings
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Time Range Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Time Period
            </label>
            <select
              value={timeRange}
              onChange={(e: any) => setTimeRange(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="30days">Last 30 Days</option>
              <option value="7days">Last 7 Days</option>
              <option value="today">Today</option>
              <option value="this_month">This Month</option>
              <option value="all">All Time</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Scrap Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="all">All Scrap Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} (₹{cat.rate_per_kg}/{cat.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Fulfillment Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed Only</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned Driver</option>
              <option value="on_the_way">On The Way</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Quick Reset */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setTimeRange('30days');
                setCategoryFilter('all');
                setStatusFilter('all');
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className="w-full text-xs font-bold px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        {/* Custom Date Range Inputs */}
        {timeRange === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Start Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">End Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>
        )}
      </div>

      {/* EXECUTIVE KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Disbursed</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              ₹{totalRevenueDisbursed.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">INR</span>
          </div>
          <p className="text-[11px] text-slate-500">Total payout cash/UPI disbursed to customers</p>
        </div>

        {/* Total Weight Collected */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Scrap Collected</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {totalScrapWeightKg.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-slate-500">KG</span>
          </div>
          <p className="text-[11px] text-slate-500">Verified door-step scale weight collected</p>
        </div>

        {/* Fulfillment Completion Rate */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completion Rate</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400 tabular-nums">
              {completionRatePct}%
            </span>
            <span className="text-[10px] text-slate-400 font-bold">
              ({completedBookings.length} / {filteredBookings.length})
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Fulfilled pickup requests ratio</p>
        </div>

        {/* Average Order Value & Unique Customers */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Avg Order Value</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
              ₹{avgOrderValue}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">per pickup</span>
          </div>
          <p className="text-[11px] text-slate-500">{uniqueCustomersCount} unique active customers served</p>
        </div>
      </div>

      {/* SCRAP CATEGORY ANALYTICS BREAKDOWN TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600" />
              Scrap Category Performance & Yield
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Weight distribution and payout volume grouped by scrap item category.
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Category CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Category Name</th>
                <th className="p-3.5">Weight Collected</th>
                <th className="p-3.5">% Share of Total</th>
                <th className="p-3.5">Total Disbursed</th>
                <th className="p-3.5">Total Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {categoryStats.map((cat) => {
                const pct = totalScrapWeightKg > 0 ? (cat.weight / totalScrapWeightKg) * 100 : 0;
                return (
                  <tr key={cat.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3.5 font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>{cat.name}</span>
                    </td>
                    <td className="p-3.5 font-bold tabular-nums">
                      {cat.weight.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">kg</span>
                    </td>
                    <td className="p-3.5 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 tabular-nums shrink-0">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      ₹{cat.revenue.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 font-bold tabular-nums text-slate-500">{cat.count} pickups</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED BOOKINGS TRANSACTION TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              Pickup Bookings Ledger ({filteredBookings.length} records)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete transaction log included in exported CSV and PDF reports.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-100 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-200 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Booking ID</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Date & Slot</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Weight</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Payout Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No pickup bookings matched the selected report filters.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3.5 font-extrabold text-slate-900 dark:text-white font-mono">
                      {b.booking_number}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">{b.customer_name}</div>
                      <div className="text-[10px] text-slate-400">{b.customer_phone}</div>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      <div>{b.preferred_date}</div>
                      <div className="text-[10px] text-slate-400">{b.preferred_time_slot}</div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          b.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : b.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold tabular-nums">
                      {b.final_weight_kg ? `${b.final_weight_kg} kg` : `${b.estimated_weight_kg || 0} kg (est)`}
                    </td>
                    <td className="p-3.5 font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {b.final_amount ? `₹${b.final_amount}` : 'Pending'}
                    </td>
                    <td className="p-3.5 text-slate-500 font-bold uppercase text-[10px]">
                      {b.payout_method}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
