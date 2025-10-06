import React from 'react';

const ChartCard = ({ title, icon: Icon, data, type = 'bar' }) => {
    const renderPieChart = (data) => {
        const total = data.reduce((sum, item) => sum + item.count, 0);
        const colors = ['#2563eb', '#059669', '#f59e0b', '#dc2626', '#7c3aed'];

        return (
            <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        {data.map((item, index) => {
                            const percentage = (item.count / total) * 100;
                            const strokeDasharray = `${percentage} ${100 - percentage}`;
                            const strokeDashoffset = data.slice(0, index).reduce((sum, prev) => sum + (prev.count / total) * 100, 0);

                            return (
                                <circle
                                    key={item._id}
                                    cx="50"
                                    cy="50"
                                    r="15.915"
                                    fill="transparent"
                                    stroke={colors[index % colors.length]}
                                    strokeWidth="8"
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={-strokeDashoffset}
                                    className="transition-all duration-300"
                                />
                            );
                        })}
                    </svg>

                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-medical-dark">{total}</div>
                            <div className="text-xs text-medical-gray">Total</div>
                        </div>
                    </div>
                </div>

                <div className="ml-8 space-y-2">
                    {data.map((item, index) => (
                        <div key={item._id} className="flex items-center space-x-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: colors[index % colors.length] }}
                            ></div>
                            <span className="text-sm text-medical-dark capitalize">
                                {item._id}: {item.count}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderLineChart = (data) => {
        const maxValue = Math.max(...data.map(d => Math.max(d.scheduled, d.completed, d.open)));
        const chartHeight = 200;
        const chartWidth = 400;
        const padding = 40;

        const getY = (value) => chartHeight - padding - ((value / maxValue) * (chartHeight - 2 * padding));
        const getX = (index) => padding + (index * (chartWidth - 2 * padding)) / (data.length - 1);

        const scheduledPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.scheduled)}`).join(' ');
        const completedPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.completed)}`).join(' ');
        const openPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.open)}`).join(' ');

        return (
            <div>
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-64">
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
                        <line
                            key={ratio}
                            x1={padding}
                            y1={getY(maxValue * ratio)}
                            x2={chartWidth - padding}
                            y2={getY(maxValue * ratio)}
                            stroke="#e5e7eb"
                            strokeWidth="1"
                        />
                    ))}

                    {/* Lines */}
                    <path d={scheduledPath} fill="none" stroke="#2563eb" strokeWidth="2" />
                    <path d={completedPath} fill="none" stroke="#059669" strokeWidth="2" />
                    <path d={openPath} fill="none" stroke="#f59e0b" strokeWidth="2" />

                    {/* Data points */}
                    {data.map((d, i) => (
                        <g key={i}>
                            <circle cx={getX(i)} cy={getY(d.scheduled)} r="3" fill="#2563eb" />
                            <circle cx={getX(i)} cy={getY(d.completed)} r="3" fill="#059669" />
                            <circle cx={getX(i)} cy={getY(d.open)} r="3" fill="#f59e0b" />
                        </g>
                    ))}

                    {/* X-axis labels */}
                    {data.map((d, i) => (
                        <text
                            key={i}
                            x={getX(i)}
                            y={chartHeight - 10}
                            textAnchor="middle"
                            className="text-xs fill-medical-gray"
                        >
                            {d._id.date ? (() => {
                                const date = new Date(d._id.date);
                                return !isNaN(date.getTime()) ? date.getDate() : '?';
                            })() : '?'}
                        </text>
                    ))}
                </svg>

                <div className="flex justify-center space-x-6 mt-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        <span className="text-sm text-medical-gray">Scheduled</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                        <span className="text-sm text-medical-gray">Completed</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                        <span className="text-sm text-medical-gray">Open</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-medical-dark flex items-center">
                    <Icon className="w-5 h-5 mr-2" />
                    {title}
                </h3>
            </div>

            <div className="h-64 flex items-center justify-center">
                {type === 'pie' && renderPieChart(data)}
                {type === 'line' && renderLineChart(data)}
                {type === 'bar' && (
                    <div className="text-center text-medical-gray">
                        <Icon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Chart visualization coming soon</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChartCard;

