import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';

import { GraphqlDataService } from '../graphql-data.service';
import { LegalReferenceType } from '../types/legal-reference.type';

@Injectable({ scope: Scope.REQUEST })
export class LegalReferencesByEventLoader extends DataLoader<
  string,
  LegalReferenceType[]
> {
  constructor(private readonly graphqlData: GraphqlDataService) {
    super(async (eventIds: readonly string[]) => {
      const refs = await graphqlData.findLegalReferencesByEventIds(eventIds);

      const grouped = new Map<string, LegalReferenceType[]>();
      for (const ref of refs) {
        const eventId = ref.eventId ?? '';
        if (!eventId) continue;
        const list = grouped.get(eventId) ?? [];
        list.push(ref);
        grouped.set(eventId, list);
      }

      return eventIds.map((id) => grouped.get(id) ?? []);
    });
  }
}
