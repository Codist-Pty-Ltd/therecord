import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';

import { GraphqlDataService } from '../graphql-data.service';
import { EventType } from '../types/event.type';

@Injectable({ scope: Scope.REQUEST })
export class EventsByCommissionLoader extends DataLoader<string, EventType[]> {
  constructor(private readonly graphqlData: GraphqlDataService) {
    super(async (commissionIds: readonly string[]) => {
      const events = await graphqlData.findEventsByCommissionIds(commissionIds);

      const grouped = new Map<string, EventType[]>();
      for (const event of events) {
        const commissionId = event.commissionId ?? '';
        if (!commissionId) continue;
        const list = grouped.get(commissionId) ?? [];
        list.push(event);
        grouped.set(commissionId, list);
      }

      return commissionIds.map((id) => grouped.get(id) ?? []);
    });
  }
}
