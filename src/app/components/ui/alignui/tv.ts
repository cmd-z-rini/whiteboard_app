// AlignUI base utility — verbatim from https://alignui.com/docs/v1.2/utils/tv
import { createTV } from 'tailwind-variants';

import { twMergeConfig } from './cn';

export type { VariantProps, ClassValue } from 'tailwind-variants';

export const tv = createTV({
  twMergeConfig,
});
