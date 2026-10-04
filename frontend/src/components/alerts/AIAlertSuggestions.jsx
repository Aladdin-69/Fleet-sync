import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Lightbulb, Check } from 'lucide-react';
import AlertRuleForm from './AlertRuleForm';

export default function AIAlertSuggestions() {
  const queryClient = useQueryClient();
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [acceptedRules, setAcceptedRules] = useState(new Set());

  // Load suggestions
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['alertSuggestions'],
    queryFn: async () => {
      const response = await apiClient.functions.invoke('suggestAlertRules', {});
      return response.data?.suggestions || [];
    },
    staleTime: 1000 * 60 * 5
  });

  // Create rule mutation
  const createRuleMutation = useMutation({
    mutationFn: (ruleData) => apiClient.entities.AlertRule.create({
      ...ruleData,
      ai_suggested: true,
      confidence_score: selectedSuggestion?.confidence_score
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertRules'] });
      setAcceptedRules(new Set([...acceptedRules, selectedSuggestion?.condition_type]));
      setSelectedSuggestion(null);
    }
  });

  const handleAcceptSuggestion = (ruleData) => {
    createRuleMutation.mutate(ruleData);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-slate-600">Analyse des données pour générer des suggestions...</p>
        </CardContent>
      </Card>
    );
  }

  if (selectedSuggestion) {
    return (
      <AlertRuleForm
        rule={selectedSuggestion}
        isSuggestion={true}
        onSave={handleAcceptSuggestion}
        onCancel={() => setSelectedSuggestion(null)}
      />
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Lightbulb className="w-12 h-12 text-yellow-500 mx-auto mb-3 opacity-50" />
          <p className="text-slate-600">Aucune suggestion pour le moment. Les suggestions apparaîtront après analyse des données historiques.</p>
        </CardContent>
      </Card>
    );
  }

  const severityColors = {
    info: 'bg-blue-100 text-blue-700',
    warning: 'bg-yellow-100 text-yellow-700',
    critical: 'bg-red-100 text-red-700'
  };

  return (
    <div className="space-y-3">
      {suggestions.map((suggestion, idx) => (
        <Card key={idx} className="border-blue-200 bg-blue-50/50 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-blue-600" />
                  <h4 className="font-semibold text-slate-900">{suggestion.name}</h4>
                  <Badge className={`${severityColors[suggestion.severity]}`}>
                    {suggestion.severity === 'critical' ? 'Critique' : 
                     suggestion.severity === 'warning' ? 'Avertissement' : 'Info'}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 mb-2">
                  Type: {suggestion.condition_type.replace(/_/g, ' ').toUpperCase()}
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-slate-200 rounded-full flex-1 max-w-xs">
                    <div
                      className="h-2 bg-blue-600 rounded-full"
                      style={{ width: `${suggestion.confidence_score}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-600">{suggestion.confidence_score}% confiance</span>
                </div>
              </div>
              <div className="flex gap-2">
                {acceptedRules.has(suggestion.condition_type) ? (
                  <Button disabled size="sm" variant="outline">
                    <Check className="w-4 h-4 mr-1" />
                    Acceptée
                  </Button>
                ) : (
                  <Button
                    onClick={() => setSelectedSuggestion(suggestion)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Accepter
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}