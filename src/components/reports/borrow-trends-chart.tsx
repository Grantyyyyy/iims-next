'use client'

import { useState, useEffect, useTransition } from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from 'lucide-react'
import { getBorrowTrends } from '@/app/actions/reports'

export function BorrowTrendsChart() {
    const [period, setPeriod] = useState<'30d' | '3m' | '6m' | '1y'>('30d')
    const [data, setData] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            const result = await getBorrowTrends(period)
            setData(result)
            setIsLoading(false)
        }
        fetchData()
    }, [period])

    const handlePeriodChange = (p: '30d' | '3m' | '6m' | '1y') => {
        startTransition(() => {
            setPeriod(p)
        })
    }

    return (
        <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="space-y-1">
                    <CardTitle>Usage Trends</CardTitle>
                    <CardDescription>Visualizing items borrowed vs returned</CardDescription>
                </div>
                <div className="flex bg-muted p-1 rounded-lg gap-1">
                    {(['30d', '3m', '6m', '1y'] as const).map((p) => (
                        <Button
                            key={p}
                            variant={period === p ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-7 px-2 text-[10px] uppercase font-bold"
                            onClick={() => handlePeriodChange(p)}
                        >
                            {p}
                        </Button>
                    ))}
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full relative">
                    {(isLoading || isPending) && (
                        <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center backdrop-blur-sm rounded-md">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}
                    
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis 
                                    dataKey="date" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false}
                                    tickFormatter={(str) => {
                                        const date = new Date(str)
                                        if (period === '30d') return format(date, 'MMM d')
                                        return format(date, 'MMM yyyy')
                                    }}
                                />
                                <YAxis 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tickFormatter={(val) => val === 0 ? '0' : val.toString()}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                                />
                                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                                <Bar 
                                    name="Borrows" 
                                    dataKey="borrows" 
                                    fill="#3b82f6" 
                                    radius={[4, 4, 0, 0]} 
                                    barSize={period === '30d' ? 12 : undefined} 
                                />
                                <Bar 
                                    name="Returns" 
                                    dataKey="returns" 
                                    fill="#10b981" 
                                    radius={[4, 4, 0, 0]} 
                                    barSize={period === '30d' ? 12 : undefined}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground italic border-2 border-dashed rounded-xl">
                            No data available for this period.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

function format(date: Date, str: string) {
    // Basic date formatter helper
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    if (str === 'MMM d') return `${months[date.getMonth()]} ${date.getDate()}`
    if (str === 'MMM yyyy') return `${months[date.getMonth()]} ${date.getFullYear()}`
    return date.toDateString()
}
