import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AccountabilityBodiesModule } from './accountability-bodies/accountability-bodies.module';
import { AdhocCommitteesModule } from './adhoc-committees/adhoc-committees.module';
import { CommissionsModule } from './commissions/commissions.module';
import { ExpenditureModule } from './expenditure/expenditure.module';
import { HealthModule } from './health/health.module';
import { HistoryModule } from './history/history.module';
import { HumanImpactModule } from './human-impact/human-impact.module';
import { ImpactModule } from './impact/impact.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { IntelligenceModule } from './intelligence/intelligence.module';
import { InvestigationsModule } from './investigations/investigations.module';
import { LegalModule } from './legal/legal.module';
import { MunicipalitiesModule } from './municipalities/municipalities.module';
import { PeopleModule } from './people/people.module';
import { ProvincesModule } from './provinces/provinces.module';
import { SearchModule } from './search/search.module';
import { SiuModule } from './siu/siu.module';
import { StoriesModule } from './stories/stories.module';
import { TakedownModule } from './takedown/takedown.module';
import { TimelineModule } from './timeline/timeline.module';
import { TransformationPoliciesModule } from './transformation-policies/transformation-policies.module';
import { YoutubeModule } from './youtube/youtube.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { StateEntitiesModule } from './state-entities/state-entities.module';
import { GraphqlModule } from './graphql/graphql.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    // Mounts the @nestjs/schedule registry so `@Cron`-decorated providers
    // (currently just IngestionSchedulerService) are picked up at boot.
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.getOrThrow<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false,
        logging: config.get<string>('NODE_ENV') === 'development' ? ['error', 'warn'] : ['error'],
      }),
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // In-memory schema outside local dev — prod/CI images must not write src/.
      autoSchemaFile:
        process.env.NODE_ENV === 'development'
          ? join(process.cwd(), 'src/schema.gql')
          : true,
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      introspection: process.env.NODE_ENV !== 'production',
      include: [GraphqlModule],
    }),
    GraphqlModule,
    AccountabilityBodiesModule,
    AdhocCommitteesModule,
    CommissionsModule,
    ExpenditureModule,
    HealthModule,
    HumanImpactModule,
    HistoryModule,
    ImpactModule,
    IngestionModule,
    IntelligenceModule,
    InvestigationsModule,
    LegalModule,
    MunicipalitiesModule,
    PeopleModule,
    ProvincesModule,
    SearchModule,
    SiuModule,
    StoriesModule,
    TakedownModule,
    TimelineModule,
    TransformationPoliciesModule,
    YoutubeModule,
    RecommendationsModule,
    StateEntitiesModule,
  ],
})
export class AppModule {}
