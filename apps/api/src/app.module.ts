import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdhocCommitteesModule } from './adhoc-committees/adhoc-committees.module';
import { CommissionsModule } from './commissions/commissions.module';
import { HealthModule } from './health/health.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { InvestigationsModule } from './investigations/investigations.module';
import { LegalModule } from './legal/legal.module';
import { PeopleModule } from './people/people.module';
import { SearchModule } from './search/search.module';
import { SiuModule } from './siu/siu.module';
import { StoriesModule } from './stories/stories.module';
import { TimelineModule } from './timeline/timeline.module';

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
    AdhocCommitteesModule,
    CommissionsModule,
    HealthModule,
    IngestionModule,
    InvestigationsModule,
    LegalModule,
    PeopleModule,
    SearchModule,
    SiuModule,
    StoriesModule,
    TimelineModule,
  ],
})
export class AppModule {}
