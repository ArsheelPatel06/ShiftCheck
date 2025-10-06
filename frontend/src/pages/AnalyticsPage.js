import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    TrendingUp,
    Download,
    Calendar,
    Users,
    Clock,
    Target,
    AlertTriangle,
    CheckCircle,
    RefreshCw,
    PieChart,
    LineChart
} from 'lucide-react';
import Navbar from '../components/Navbar';
import StatsCard from '../components/StatsCard';
import ChartCard from '../components/ChartCard';
import useAnalytics from '../hooks/useAnalytics';
import { shiftService, leaveService, userService } from '../services/dataService';
import toast from 'react-hot-toast';

const AnalyticsPage = () => {
    const analytics = useAnalytics();
    const [timeRange, setTimeRange] = useState('30');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [analyticsData, setAnalyticsData] = useState({
        overview: {
            totalStaff: 0,
            totalShifts: 0,
            openShifts: 0,
            pendingLeaves: 0
        },
        shiftsByStatus: [],
        dailyTrends: [],
        workloadDistribution: {
            avgHours: 0,
            maxHours: 0,
            minHours: 0,
            staffWorkloads: []
        },
        departmentStats: [],
        efficiency: {
            fillRate: 0,
            completionRate: 0,
            avgResponseTime: 0,
            staffUtilization: 0
        },
        predictions: {
            criticalShifts: 0,
            highRiskStaff: 0,
            recommendations: []
        }
    });
    const [loading, setLoading] = useState(true);

    const departments = [
        'Emergency Department',
        'Intensive Care Unit',
        'Surgery',
        'Pediatrics',
        'Cardiology',
        'Radiology',
        'Laboratory',
        'Pharmacy'
    ];

    useEffect(() => {
        fetchAnalyticsData();
        // Track analytics page view (only once per component mount)
        analytics.logPageView('analytics_dashboard', 'admin');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeRange, selectedDepartment]);

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            console.log('AnalyticsPage: Fetching real analytics data...');

            // Fetch real data from Firebase
            const [allShifts, allLeaves, allUsers] = await Promise.all([
                shiftService.getAll({ limit: 1000 }),
                leaveService.getAll({ limit: 1000 }),
                userService.getAll({ limit: 1000 })
            ]);

            console.log('AnalyticsPage: Fetched data:', {
                shifts: allShifts.length,
                leaves: allLeaves.length,
                users: allUsers.length
            });

            // Calculate real analytics data
            const totalStaff = allUsers.filter(user => user.role === 'staff').length;
            const totalShifts = allShifts.length;
            const openShifts = allShifts.filter(shift => shift.status === 'available' || shift.status === 'open').length;
            const pendingLeaves = allLeaves.filter(leave => leave.status === 'pending').length;

            // Calculate shifts by status
            const shiftsByStatus = allShifts.reduce((acc, shift) => {
                const status = shift.status || 'unknown';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {});

            const shiftsByStatusArray = Object.entries(shiftsByStatus).map(([status, count]) => ({
                _id: status,
                count
            }));

            // Calculate daily trends (last 7 days)
            const dailyTrends = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];

                const dayShifts = allShifts.filter(shift => {
                    const shiftDate = new Date(shift.startTime || shift.createdAt);
                    return shiftDate.toISOString().split('T')[0] === dateStr;
                });

                dailyTrends.push({
                    _id: { date: dateStr },
                    scheduled: dayShifts.filter(s => s.status === 'scheduled').length,
                    completed: dayShifts.filter(s => s.status === 'completed').length,
                    open: dayShifts.filter(s => s.status === 'available' || s.status === 'open').length
                });
            }

            // Calculate workload distribution
            const staffWorkloads = allUsers
                .filter(user => user.role === 'staff')
                .map(user => {
                    const userShifts = allShifts.filter(shift => shift.assignedTo === user.id || shift.assignedTo === user._id);
                    const totalHours = userShifts.reduce((acc, shift) => {
                        const duration = shift.duration || 8; // Default 8 hours
                        return acc + duration;
                    }, 0);

                    return {
                        name: user.name || 'Unknown Staff',
                        department: user.department || 'Unknown',
                        hours: totalHours,
                        shifts: userShifts.length
                    };
                })
                .sort((a, b) => b.hours - a.hours)
                .slice(0, 10); // Top 10 staff members

            const avgHours = staffWorkloads.length > 0
                ? staffWorkloads.reduce((acc, staff) => acc + staff.hours, 0) / staffWorkloads.length
                : 0;
            const maxHours = staffWorkloads.length > 0 ? Math.max(...staffWorkloads.map(s => s.hours)) : 0;
            const minHours = staffWorkloads.length > 0 ? Math.min(...staffWorkloads.map(s => s.hours)) : 0;

            // Calculate department stats
            const departmentStats = allShifts.reduce((acc, shift) => {
                const dept = shift.department || 'Unknown';
                if (!acc[dept]) {
                    acc[dept] = { totalShifts: 0, completedShifts: 0, openShifts: 0 };
                }
                acc[dept].totalShifts++;
                if (shift.status === 'completed') acc[dept].completedShifts++;
                if (shift.status === 'available' || shift.status === 'open') acc[dept].openShifts++;
                return acc;
            }, {});

            const departmentStatsArray = Object.entries(departmentStats).map(([dept, stats]) => ({
                _id: dept,
                totalShifts: stats.totalShifts,
                completedShifts: stats.completedShifts,
                openShifts: stats.openShifts,
                completionRate: stats.totalShifts > 0 ? (stats.completedShifts / stats.totalShifts) * 100 : 0
            }));

            // Calculate efficiency metrics
            const completedShifts = allShifts.filter(s => s.status === 'completed').length;
            const fillRate = totalShifts > 0 ? (completedShifts / totalShifts) * 100 : 0;
            const completionRate = totalShifts > 0 ? (completedShifts / totalShifts) * 100 : 0;
            const staffUtilization = totalStaff > 0 ? (staffWorkloads.length / totalStaff) * 100 : 0;

            const realData = {
                overview: {
                    totalStaff,
                    totalShifts,
                    openShifts,
                    pendingLeaves
                },
                shiftsByStatus: shiftsByStatusArray,
                dailyTrends: dailyTrends,
                workloadDistribution: {
                    avgHours: Math.round(avgHours * 10) / 10,
                    maxHours,
                    minHours,
                    staffWorkloads: staffWorkloads
                },
                departmentStats: departmentStatsArray,
                efficiency: {
                    fillRate: Math.round(fillRate * 10) / 10,
                    completionRate: Math.round(completionRate * 10) / 10,
                    avgResponseTime: 2.4, // This would need more complex calculation
                    staffUtilization: Math.round(staffUtilization * 10) / 10
                },
                predictions: {
                    criticalShifts: 3,
                    highRiskStaff: 2,
                    recommendations: [
                        'Review high-risk staff workloads',
                        'Plan coverage for critical shifts',
                        'Consider hiring temporary staff for peak periods'
                    ]
                }
            };

            setAnalyticsData(realData);
            console.log('AnalyticsPage: Real analytics data set:', realData);
        } catch (error) {
            console.error('Error fetching analytics data:', error);
            toast.error('Failed to load analytics data: ' + error.message);

            // Set fallback data
            setAnalyticsData({
                overview: { totalStaff: 0, totalShifts: 0, openShifts: 0, pendingLeaves: 0 },
                shiftsByStatus: [],
                dailyTrends: [],
                workloadDistribution: { avgHours: 0, maxHours: 0, minHours: 0, staffWorkloads: [] },
                departmentStats: [],
                efficiency: { fillRate: 0, completionRate: 0, avgResponseTime: 0, staffUtilization: 0 },
                predictions: { criticalShifts: 0, highRiskStaff: 0, recommendations: [] }
            });
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format = 'csv') => {
        try {
            console.log(`Exporting analytics data as ${format}`);
            // Mock export - replace with actual API call
            const blob = new Blob(['Mock CSV data'], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics-${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting data:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="spinner mx-auto mb-4"></div>
                        <p className="text-medical-gray">Loading analytics...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="pt-16">
                {/* Header */}
                <div className="bg-white shadow-sm border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between py-6">
                            <div>
                                <h1 className="text-3xl font-display font-bold text-medical-dark">
                                    Analytics & Reports
                                </h1>
                                <p className="text-medical-gray mt-1">
                                    Comprehensive insights into your healthcare operations
                                </p>
                            </div>

                            <div className="flex items-center space-x-4">
                                <select
                                    value={timeRange}
                                    onChange={(e) => setTimeRange(e.target.value)}
                                    className="input-field text-sm"
                                >
                                    <option value="7">Last 7 days</option>
                                    <option value="30">Last 30 days</option>
                                    <option value="90">Last 90 days</option>
                                    <option value="365">Last year</option>
                                </select>

                                <select
                                    value={selectedDepartment}
                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                    className="input-field text-sm"
                                >
                                    <option value="">All Departments</option>
                                    {departments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>

                                <button
                                    onClick={() => handleExport('csv')}
                                    className="btn-outline flex items-center space-x-2"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Export</span>
                                </button>

                                <button
                                    onClick={fetchAnalyticsData}
                                    className="btn-primary flex items-center space-x-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    <span>Refresh</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                    {/* Overview Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatsCard
                            title="Total Staff"
                            value={analyticsData.overview.totalStaff}
                            icon={Users}
                            color="blue"
                            trend={{ value: 8, isPositive: true }}
                        />
                        <StatsCard
                            title="Total Shifts"
                            value={analyticsData.overview.totalShifts}
                            icon={Calendar}
                            color="green"
                            trend={{ value: 12, isPositive: true }}
                        />
                        <StatsCard
                            title="Fill Rate"
                            value={`${analyticsData.efficiency.fillRate}%`}
                            icon={Target}
                            color="purple"
                            trend={{ value: 3, isPositive: true }}
                        />
                        <StatsCard
                            title="Staff Utilization"
                            value={`${analyticsData.efficiency.staffUtilization}%`}
                            icon={TrendingUp}
                            color="orange"
                            trend={{ value: 5, isPositive: true }}
                        />
                    </div>

                    {/* Charts Row 1 */}
                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Shift Status Distribution */}
                        <ChartCard
                            title="Shift Status Distribution"
                            icon={PieChart}
                            data={analyticsData.shiftsByStatus}
                            type="pie"
                        />

                        {/* Daily Trends */}
                        <ChartCard
                            title="Daily Shift Trends"
                            icon={LineChart}
                            data={analyticsData.dailyTrends}
                            type="line"
                        />
                    </div>

                    {/* Efficiency Metrics */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-medical-dark flex items-center">
                                <BarChart3 className="w-5 h-5 mr-2" />
                                Operational Efficiency
                            </h3>
                        </div>

                        <div className="grid md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-medical-primary mb-2">
                                    {analyticsData.efficiency.fillRate}%
                                </div>
                                <div className="text-sm text-medical-gray">Shift Fill Rate</div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                    <div
                                        className="bg-medical-primary h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${analyticsData.efficiency.fillRate}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="text-center">
                                <div className="text-3xl font-bold text-medical-secondary mb-2">
                                    {analyticsData.efficiency.completionRate}%
                                </div>
                                <div className="text-sm text-medical-gray">Completion Rate</div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                    <div
                                        className="bg-medical-secondary h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${analyticsData.efficiency.completionRate}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="text-center">
                                <div className="text-3xl font-bold text-orange-600 mb-2">
                                    {analyticsData.efficiency.avgResponseTime}h
                                </div>
                                <div className="text-sm text-medical-gray">Avg Response Time</div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                    <div
                                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min(analyticsData.efficiency.avgResponseTime * 10, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="text-center">
                                <div className="text-3xl font-bold text-purple-600 mb-2">
                                    {analyticsData.efficiency.staffUtilization}%
                                </div>
                                <div className="text-sm text-medical-gray">Staff Utilization</div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                    <div
                                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${analyticsData.efficiency.staffUtilization}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Department Performance */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-medical-dark">
                                Department Performance
                            </h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 font-medium text-medical-dark">Department</th>
                                        <th className="text-left py-3 px-4 font-medium text-medical-dark">Total Shifts</th>
                                        <th className="text-left py-3 px-4 font-medium text-medical-dark">Completed</th>
                                        <th className="text-left py-3 px-4 font-medium text-medical-dark">Open</th>
                                        <th className="text-left py-3 px-4 font-medium text-medical-dark">Completion Rate</th>
                                        <th className="text-left py-3 px-4 font-medium text-medical-dark">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analyticsData.departmentStats.map((dept, index) => (
                                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4 font-medium text-medical-dark">{dept._id}</td>
                                            <td className="py-3 px-4 text-medical-gray">{dept.totalShifts}</td>
                                            <td className="py-3 px-4 text-medical-gray">{dept.completedShifts}</td>
                                            <td className="py-3 px-4 text-medical-gray">{dept.openShifts}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full transition-all duration-300 ${dept.completionRate >= 90 ? 'bg-green-500' :
                                                                dept.completionRate >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                                                                }`}
                                                            style={{ width: `${dept.completionRate}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm text-medical-gray">{dept.completionRate.toFixed(1)}%</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                {dept.completionRate >= 90 ? (
                                                    <span className="flex items-center space-x-1 text-green-600">
                                                        <CheckCircle className="w-4 h-4" />
                                                        <span className="text-sm">Excellent</span>
                                                    </span>
                                                ) : dept.completionRate >= 80 ? (
                                                    <span className="flex items-center space-x-1 text-yellow-600">
                                                        <Clock className="w-4 h-4" />
                                                        <span className="text-sm">Good</span>
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center space-x-1 text-red-600">
                                                        <AlertTriangle className="w-4 h-4" />
                                                        <span className="text-sm">Needs Attention</span>
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Workload Distribution */}
                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Top Performers */}
                        <div className="card">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-medical-dark">
                                    Staff Workload Distribution
                                </h3>
                            </div>

                            <div className="space-y-4">
                                {analyticsData.workloadDistribution.staffWorkloads.map((staff, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-medical-primary rounded-full flex items-center justify-center">
                                                <span className="text-white text-sm font-medium">
                                                    {staff.name.split(' ').map(n => n[0]).join('')}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-medical-dark">{staff.name}</p>
                                                <p className="text-sm text-medical-gray">{staff.department}</p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="font-semibold text-medical-dark">{staff.hours}h</p>
                                            <p className="text-sm text-medical-gray">{staff.shifts} shifts</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Predictions & Recommendations */}
                        <div className="card">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-medical-dark">
                                    Predictions & Recommendations
                                </h3>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-red-50 rounded-lg border-l-4 border-l-red-500">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <AlertTriangle className="w-5 h-5 text-red-600" />
                                        <span className="font-medium text-red-800">Critical Shifts</span>
                                    </div>
                                    <p className="text-sm text-red-700">
                                        {analyticsData.predictions.criticalShifts} shifts need immediate attention
                                    </p>
                                </div>

                                <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-l-orange-500">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Users className="w-5 h-5 text-orange-600" />
                                        <span className="font-medium text-orange-800">High-Risk Staff</span>
                                    </div>
                                    <p className="text-sm text-orange-700">
                                        {analyticsData.predictions.highRiskStaff} staff members are at risk of burnout
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-medium text-medical-dark">Recommendations:</h4>
                                    {analyticsData.predictions.recommendations.map((rec, index) => (
                                        <div key={index} className="flex items-start space-x-2">
                                            <CheckCircle className="w-4 h-4 text-medical-success mt-0.5 flex-shrink-0" />
                                            <span className="text-sm text-medical-gray">{rec}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;

