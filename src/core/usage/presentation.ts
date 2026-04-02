import type {
  AIConfigAppDefinition,
  AIConfigMode,
  AIConfigState,
  AIModelDescriptor,
  AIUsagePresentation,
} from '../types/public';

export function getAIUsagePresentation(
  state: AIConfigState,
  appDefinition?: AIConfigAppDefinition,
): AIUsagePresentation {
  if (state.mode === 'default') {
    return {
      modeLabel: appDefinition?.defaultMode?.label ?? 'App-provided AI',
      usageHint:
        appDefinition?.defaultMode?.usageHint ?? appDefinition?.usagePresentation?.freeTierHint,
      freeTierHint: appDefinition?.usagePresentation?.freeTierHint,
    };
  }

  return {
    modeLabel: appDefinition?.usagePresentation?.modeLabel ?? 'Bring your own key',
    usageHint:
      appDefinition?.usagePresentation?.usageHint ??
      'You are using your own provider key. Provider charges may apply.',
    costHint:
      appDefinition?.usagePresentation?.costHint ??
      'Costs depend on your selected provider and model.',
    freeTierHint: appDefinition?.usagePresentation?.freeTierHint,
  };
}

export function getModelCostWarning(model?: AIModelDescriptor): string | undefined {
  if (!model?.costHint) {
    return undefined;
  }

  if (model.costHint === 'high') {
    return 'This model may have higher usage cost than lighter-weight alternatives.';
  }

  if (model.costHint === 'medium') {
    return 'This model may cost more than entry-level options.';
  }

  return undefined;
}

export function isAppProvidedMode(mode: AIConfigMode): boolean {
  return mode === 'default';
}
