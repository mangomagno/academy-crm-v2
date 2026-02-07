'use client';

import { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { format, subMonths, parse } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Payment } from '@/types';

interface EarningsChartProps {
    payments: Payment[];
}

export function EarningsChart({ payments }: EarningsChartProps) {
    const chartData = useMemo(() => {
        // Last 6 months
        const last6Months = Array.from({ length: 6 }).map((_, i) => {
            const date = subMonths(new Date(), 5 - i);
            return format(date, 'yyyy-MM');
        });

        return last6Months.map((month) => {
            const monthPayments = payments.filter((p) => p.month === month);
            const paid = monthPayments
                .filter((p) => p.status === 'paid')
                .reduce((sum, p) => sum + p.amount, 0);
            const unpaid = monthPayments
                .filter((p) => p.status === 'unpaid')
                .reduce((sum, p) => sum + p.amount, 0);

            const monthDate = parse(month, 'yyyy-MM', new Date());

            return {
                name: format(monthDate, 'MMM'),
                paid,
                unpaid,
                total: paid + unpaid,
            };
        });
    }, [payments]);

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Earnings History</CardTitle>
                <CardDescription>
                    Earnings across the last 6 months (Paid vs Unpaid)
                </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{
                                    borderRadius: 'var(--radius)',
                                    border: '1px solid var(--border)',
                                    backgroundColor: 'var(--background)',
                                }}
                                formatter={(value: number) => [`$${value}`, '']}
                            />
                            <Legend />
                            <Bar
                                dataKey="paid"
                                name="Paid"
                                fill="hsl(var(--primary))"
                                radius={[4, 4, 0, 0]}
                            />
                            <Bar
                                dataKey="unpaid"
                                name="Unpaid"
                                fill="hsl(var(--muted))"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
