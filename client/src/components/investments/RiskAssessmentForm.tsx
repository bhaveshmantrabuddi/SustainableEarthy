import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { insertRiskAssessmentSchema } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

// Extend the schema with client-side validation
const formSchema = insertRiskAssessmentSchema.extend({
  riskTolerance: z.number().min(1).max(10),
  environmentalPriority: z.number().min(1).max(10),
});

type FormValues = z.infer<typeof formSchema>;

interface RiskAssessmentFormProps {
  onComplete: (riskLevel: string) => void;
}

export default function RiskAssessmentForm({ onComplete }: RiskAssessmentFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ageGroup: '18-30',
      investmentTimeframe: 'medium_term',
      riskTolerance: 5,
      financialGoals: 'growth',
      existingInvestments: false,
      incomeLevel: 'moderate',
      savingsPercentage: 10,
      environmentalPriority: 8,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest('POST', '/api/risk-assessment', data);
      const result = await response.json();
      
      toast({
        title: 'Risk Assessment Complete',
        description: `Your recommended risk level is ${result.recommendedRiskLevel}`,
      });
      
      onComplete(result.recommendedRiskLevel);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'There was a problem saving your risk assessment.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Investment Risk Assessment</CardTitle>
        <CardDescription>
          Help us understand your investment preferences and risk tolerance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="ageGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age Group</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select age group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="18-30">18-30</SelectItem>
                      <SelectItem value="31-45">31-45</SelectItem>
                      <SelectItem value="46-60">46-60</SelectItem>
                      <SelectItem value="60+">60+</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="investmentTimeframe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Investment Timeframe</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeframe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="short_term">Short Term (1-3 years)</SelectItem>
                      <SelectItem value="medium_term">Medium Term (4-7 years)</SelectItem>
                      <SelectItem value="long_term">Long Term (8+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="riskTolerance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risk Tolerance (1-10)</FormLabel>
                  <FormControl>
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      defaultValue={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      className="pt-2"
                    />
                  </FormControl>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Conservative</span>
                    <span>Moderate</span>
                    <span>Aggressive</span>
                  </div>
                  <FormDescription>
                    Current value: {field.value}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="financialGoals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Financial Goal</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select financial goal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="preservation">Capital Preservation</SelectItem>
                      <SelectItem value="income">Income Generation</SelectItem>
                      <SelectItem value="growth">Long-term Growth</SelectItem>
                      <SelectItem value="impact">Impact Investing</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="existingInvestments"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Existing Investments</FormLabel>
                    <FormDescription>
                      Do you have other investment accounts?
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="incomeLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Income Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select income level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Below $40,000</SelectItem>
                      <SelectItem value="moderate">$40,000 - $100,000</SelectItem>
                      <SelectItem value="high">$100,000 - $200,000</SelectItem>
                      <SelectItem value="very_high">Above $200,000</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="savingsPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Savings (% of Income)</FormLabel>
                  <FormControl>
                    <Slider
                      min={0}
                      max={50}
                      step={1}
                      defaultValue={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      className="pt-2"
                    />
                  </FormControl>
                  <FormDescription>
                    Current value: {field.value}%
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="environmentalPriority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Environmental Priority (1-10)</FormLabel>
                  <FormControl>
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      defaultValue={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      className="pt-2"
                    />
                  </FormControl>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Less Important</span>
                    <span>Balanced</span>
                    <span>Top Priority</span>
                  </div>
                  <FormDescription>
                    Current value: {field.value}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Analyzing...' : 'Complete Assessment'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}