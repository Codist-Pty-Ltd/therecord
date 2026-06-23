import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';

import { GraphqlDataService } from '../graphql-data.service';
import { ArticleType } from '../types/article.type';

@Injectable({ scope: Scope.REQUEST })
export class ArticlesByCommissionLoader extends DataLoader<
  string,
  ArticleType[]
> {
  constructor(private readonly graphqlData: GraphqlDataService) {
    super(async (commissionIds: readonly string[]) => {
      const articles =
        await graphqlData.findArticlesByCommissionIds(commissionIds);

      const grouped = new Map<string, ArticleType[]>();
      for (const article of articles) {
        const commissionId = article.commissionId ?? '';
        if (!commissionId) continue;
        const list = grouped.get(commissionId) ?? [];
        list.push(article);
        grouped.set(commissionId, list);
      }

      return commissionIds.map((id) => grouped.get(id) ?? []);
    });
  }
}
