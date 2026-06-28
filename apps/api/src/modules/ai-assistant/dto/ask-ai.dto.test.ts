import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { AskAiDto } from './ask-ai.dto.js';

describe('AskAiDto', () => {
  it('accepts a valid AI question', async () => {
    const dto = plainToInstance(AskAiDto, {
      question: 'Which vessel calls need attention?',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects short questions', async () => {
    const dto = plainToInstance(AskAiDto, { question: 'hi' });

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });
});
