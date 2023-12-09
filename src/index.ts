import { Logger } from '@resourvereign/plugin-types/logger.js';
import { PluginSchema } from '@resourvereign/plugin-types/plugin/index.js';
import {
  ScheduleMiddlewareContext,
  SchedulingPlugin,
} from '@resourvereign/plugin-types/plugin/scheduling.js';
import { adjust, parse } from 'compact-relative-time-notation';

const schema: PluginSchema = {
  properties: {
    relativeTimeFromIntent: {
      type: 'string',
      metadata: {
        name: 'Stop if not completed by',
        description:
          'Compact relative time modifier to apply to the intent date. Any attempt scheduled after this date, will be ignored.',
      },
    },
  },
};

type DesistData = {
  relativeTimeFromIntent: string;
};

const initialize = async ({ relativeTimeFromIntent }: DesistData, logger: Logger) => {
  return {
    validate() {
      logger.debug(`Starting validation`);
      return !!parse(relativeTimeFromIntent);
    },
    async scheduleMiddleware(context: ScheduleMiddlewareContext, next: () => Promise<void>) {
      logger.debug(
        `Intent date: ${context.intent.date}, candidate: ${context.date}, reason: ${context.reason}, relativeTimeFromIntent: ${relativeTimeFromIntent}`,
      );
      if (!context.date) {
        logger.debug(`Date is undefined, nothing to do`);
        return await next();
      }

      const limit = adjust(context.intent.date, relativeTimeFromIntent);
      if (context.date > limit) {
        logger.debug(`Candidate date ${context.date} is after limit ${limit}, cancelling`);
        context.date = undefined;
      } else {
        logger.debug(`Candidate date ${context.date} is before limit: ${limit}, nothing to do`);
      }
      return await next();
    },
  };
};

export default {
  schema,
  initialize,
} satisfies SchedulingPlugin<DesistData>;
