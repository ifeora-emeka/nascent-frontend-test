import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Asset, OrderSide, Order } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'
import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'
import { CurrencyInput } from './ui/currency-input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form'
import { IconShoppingCart } from '@tabler/icons-react'

const orderFormSchema = z.object({
    price: z.string().refine((val) => {
        const num = parseFloat(val)
        return !isNaN(num) && num > 0
    }, { message: 'Price must be greater than 0' }),
    quantity: z.string().refine((val) => {
        const num = parseFloat(val)
        return !isNaN(num) && num > 0
    }, { message: 'Quantity must be greater than 0' }),
    notional: z.string().refine((val) => {
        const num = parseFloat(val)
        return !isNaN(num) && num > 0
    }, { message: 'Total must be greater than 0' })
})

type OrderFormValues = z.infer<typeof orderFormSchema>

interface OrderEntryFormProps {
    asset: Asset
    midPrice: number
    bestBid: number
    bestAsk: number
    onSubmit: (order: Order) => Promise<void>
    isLoading?: boolean
}

export default function OrderEntryForm({ asset, midPrice, bestBid, bestAsk, onSubmit, isLoading = false }: OrderEntryFormProps) {
    const [side, setSide] = useState<OrderSide>('BUY')
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<OrderFormValues>({
        resolver: zodResolver(orderFormSchema),
        defaultValues: {
            price: midPrice.toFixed(2),
            quantity: '',
            notional: ''
        },
        mode: 'onChange'
    })

    useEffect(() => {
        const currentPrice = form.getValues('price')
        if (!currentPrice || currentPrice === '0.00') {
            form.setValue('price', midPrice.toFixed(2))
        }
    }, [midPrice, form])

    const handlePriceChange = (value: string | undefined) => {
        if (value) {
            form.setValue('price', value, { shouldValidate: true })
            const quantity = form.getValues('quantity')
            if (quantity && value) {
                const calculatedNotional = parseFloat(quantity) * parseFloat(value)
                form.setValue('notional', calculatedNotional.toFixed(2), { shouldValidate: true })
            }
        } else {
            form.setValue('price', '', { shouldValidate: true })
        }
    }

    const handleQuantityChange = (value: string | undefined) => {
        if (value) {
            form.setValue('quantity', value, { shouldValidate: true })
            const price = form.getValues('price')
            if (price && value) {
                const calculatedNotional = parseFloat(value) * parseFloat(price)
                form.setValue('notional', calculatedNotional.toFixed(2), { shouldValidate: true })
            }
        } else {
            form.setValue('quantity', '', { shouldValidate: true })
        }
    }

    const handleNotionalChange = (value: string | undefined) => {
        if (value) {
            form.setValue('notional', value, { shouldValidate: true })
            const price = form.getValues('price')
            const priceNum = parseFloat(price)
            if (price && value && !isNaN(priceNum) && priceNum > 0) {
                const calculatedQuantity = parseFloat(value) / priceNum
                form.setValue('quantity', calculatedQuantity.toFixed(8), { shouldValidate: true })
            }
        } else {
            form.setValue('notional', '', { shouldValidate: true })
        }
    }

    const handleQuickFill = (type: 'MID' | 'BID' | 'ASK') => {
        const priceValue = type === 'MID' ? midPrice : type === 'BID' ? bestBid : bestAsk
        form.setValue('price', priceValue.toFixed(2), { shouldValidate: true })
        const quantity = form.getValues('quantity')
        if (quantity) {
            const calculatedNotional = parseFloat(quantity) * priceValue
            form.setValue('notional', calculatedNotional.toFixed(2), { shouldValidate: true })
        }
    }

    const handleFormSubmit = async (data: OrderFormValues) => {
        setMessage(null)
        setIsSubmitting(true)

        const order: Order = {
            asset,
            side,
            type: 'LIMIT',
            quantity: parseFloat(data.quantity),
            price: parseFloat(data.price),
            notional: parseFloat(data.notional)
        }

        try {
            await onSubmit(order)
            setMessage({ type: 'success', text: 'Order placed successfully!' })
            form.setValue('quantity', '')
            form.setValue('notional', '')
            form.setValue('price', midPrice.toFixed(2))
        } catch (error) {
            setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Order failed' })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card className="border-border/50 shadow-lg">
            <CardHeader className="border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-xl">
                    Order Entry
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {isLoading ? (
                    <div className="space-y-6">
                        <Skeleton className="h-10 w-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-10 w-full" />
                            <div className="flex gap-2">
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-8 w-16" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <Skeleton className="h-11 w-full" />
                    </div>
                ) : (
                    <>
                <Tabs value={side} onValueChange={(value) => setSide(value as OrderSide)}>
                    <TabsList>
                        <TabsTrigger value="BUY">
                            Buy
                        </TabsTrigger>
                        <TabsTrigger value="SELL">
                            Sell
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Limit Price</FormLabel>
                                    <FormControl>
                                        <div className="flex gap-2">
                                            <CurrencyInput
                                                placeholder="0.00"
                                                value={field.value}
                                                onValueChange={handlePriceChange}
                                                decimalsLimit={2}
                                                allowNegativeValue={false}
                                                className="flex-1"
                                            />
                                            <span className="flex items-center text-sm text-muted-foreground">USD</span>
                                        </div>
                                    </FormControl>
                                    <div className="flex gap-2 mt-2">
                                        <Button type="button" size="sm" variant="outline" onClick={() => handleQuickFill('MID')} className="text-xs">
                                            MID
                                        </Button>
                                        <Button type="button" size="sm" variant="outline" onClick={() => handleQuickFill('BID')} className="text-xs">
                                            BID
                                        </Button>
                                        <Button type="button" size="sm" variant="outline" onClick={() => handleQuickFill('ASK')} className="text-xs">
                                            ASK
                                        </Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount</FormLabel>
                                    <FormControl>
                                        <div className="flex gap-2">
                                            <CurrencyInput
                                                placeholder="0.00000000"
                                                value={field.value}
                                                onValueChange={handleQuantityChange}
                                                decimalsLimit={8}
                                                allowNegativeValue={false}
                                                className="flex-1"
                                            />
                                            <span className="flex items-center text-sm text-muted-foreground">{asset}</span>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notional"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Total</FormLabel>
                                    <FormControl>
                                        <div className="flex gap-2">
                                            <CurrencyInput
                                                placeholder="0.00"
                                                value={field.value}
                                                onValueChange={handleNotionalChange}
                                                decimalsLimit={2}
                                                allowNegativeValue={false}
                                                className="flex-1"
                                            />
                                            <span className="flex items-center text-sm text-muted-foreground">USD</span>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {message && (
                            <div className={`p-3 rounded-md border ${message.type === 'success'
                                ? 'bg-primary/10 border-primary/50 text-primary'
                                : 'bg-destructive/10 border-destructive/50 text-destructive'
                                }`}>
                                <p className="text-sm font-medium">{message.text}</p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            variant={side === 'SELL' ? 'destructive' : 'default'}
                            className="w-full h-11 font-semibold"
                        >
                            <IconShoppingCart className="size-4 mr-2" />
                            {isSubmitting ? 'Submitting...' : `${side === 'BUY' ? 'Buy' : 'Sell'} ${asset}`}
                        </Button>
                    </form>
                </Form>
                </>
                )}
            </CardContent>
        </Card>
    )
}
