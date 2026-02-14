'use client';

import { useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
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
import { es, enUS } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Payment } from '@/types';

interface EarningsChartProps {
    payments: Payment[];
}

export function EarningsChart({ payments }: EarningsChartProps) {
    const t = useTranslations('earningsChart');
    const locale = useLocale();
    const dateFnsLocale = locale === 'es' ? es : enUS;

    const chartData = useMemo(() => {
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
                name: format(monthDate, 'MMM', { locale: dateFnsLocale }),
                paid,
                unpaid,
                total: paid + unpaid,
            };
        });
    }, [payments, dateFnsLocale]);

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>{t('title')}</CardTitle>
                <CardDescription>{t('description')}</CardDescription>
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
                                name={t('paid')}
                                fill="hsl(var(--primary))"
                                radius={[4, 4, 0, 0]}
                            />
                            <Bar
                                dataKey="unpaid"
                                name={t('unpaid')}
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
