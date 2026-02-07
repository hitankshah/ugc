export interface EnhancementResult {
  original: string;
  enhanced: string;
  improvements: string[];
}

export function enhanceImagePrompt(userPrompt: string): EnhancementResult {
  const improvements: string[] = [];
  let enhanced = userPrompt.trim();

  if (enhanced.length < 20) {
    const extension = ', professional product photography, high resolution, commercial quality, clean background, studio lighting, sharp focus';
    enhanced += extension;
    improvements.push('Added professional photography elements');
  }

  if (!enhanced.toLowerCase().includes('quality') && !enhanced.toLowerCase().includes('resolution')) {
    enhanced += ', ultra high quality, 8K resolution';
    improvements.push('Added quality specifications');
  }

  if (!enhanced.toLowerCase().includes('light')) {
    enhanced += ', professional lighting setup';
    improvements.push('Added lighting details');
  }

  if (!enhanced.toLowerCase().includes('commercial') && !enhanced.toLowerCase().includes('product')) {
    enhanced = `Commercial product shot: ${enhanced}`;
    improvements.push('Framed as commercial product');
  }

  enhanced += ', award-winning composition, brand-ready, advertisement quality';
  improvements.push('Added commercial-grade descriptors');

  return {
    original: userPrompt,
    enhanced,
    improvements,
  };
}

export function enhanceVideoPrompt(
  userPrompt: string,
  productName: string,
  productContext: string,
  model: string
): EnhancementResult {
  const improvements: string[] = [];
  let enhanced = userPrompt.trim();

  enhanced = `UGC-style product video for ${productName}. ${enhanced}`;
  improvements.push('Added UGC framing and product context');

  const contextElements = productContext.toLowerCase();

  if (contextElements.includes('lifestyle') || contextElements.includes('daily')) {
    enhanced += '. Show authentic daily use, natural lighting, relatable setting';
    improvements.push('Added lifestyle authenticity');
  }

  if (contextElements.includes('demo') || contextElements.includes('tutorial')) {
    enhanced += '. Clear step-by-step demonstration, hands in frame, close-up product details';
    improvements.push('Added tutorial elements');
  }

  if (!enhanced.toLowerCase().includes('transition')) {
    enhanced += '. Smooth transitions between product angles';
    improvements.push('Added transition instructions');
  }

  if (model.includes('nano') || model.includes('fast')) {
    enhanced += '. Optimized for quick generation, clear focal points';
    improvements.push('Optimized for selected model');
  }

  enhanced += '. High-conversion social media format, attention-grabbing opening, product benefits clear, ad-ready output';
  improvements.push('Added conversion-focused elements');

  return {
    original: userPrompt,
    enhanced,
    improvements,
  };
}

export function analyzePromptQuality(prompt: string): {
  score: number;
  suggestions: string[];
} {
  const suggestions: string[] = [];
  let score = 50;

  if (prompt.length > 30) score += 10;
  if (prompt.length > 60) score += 10;

  if (prompt.toLowerCase().includes('product')) score += 10;
  else suggestions.push('Consider mentioning product focus');

  if (prompt.toLowerCase().includes('professional') || prompt.toLowerCase().includes('commercial')) {
    score += 10;
  } else {
    suggestions.push('Add professional/commercial context');
  }

  if (prompt.split(',').length > 2) score += 10;
  else suggestions.push('Add more descriptive elements');

  return { score: Math.min(score, 100), suggestions };
}
