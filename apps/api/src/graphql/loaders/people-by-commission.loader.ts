import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';

import { PeopleService } from '../../people/people.service';
import { mapPersonRow } from '../mappers';
import { PersonType } from '../types/person.type';

@Injectable({ scope: Scope.REQUEST })
export class PeopleByCommissionLoader extends DataLoader<string, PersonType[]> {
  constructor(private readonly peopleService: PeopleService) {
    super(async (commissionIds: readonly string[]) => {
      const people = await peopleService.findByCommissionIds([
        ...commissionIds,
      ]);

      const grouped = new Map<string, PersonType[]>();
      for (const row of people) {
        const list = grouped.get(row.commissionId) ?? [];
        list.push(mapPersonRow(row));
        grouped.set(row.commissionId, list);
      }

      return commissionIds.map((id) => grouped.get(id) ?? []);
    });
  }
}
