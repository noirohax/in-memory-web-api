import { async, TestBed } from '@angular/core/testing';
import { HttpModule, Http } from '@angular/http';

import 'rxjs/add/operator/concat';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/zip';

import { failure } from '../testing';

import { Hero } from './hero';
import { HeroService } from './hero.service';
import { HttpHeroService } from './http-hero.service';

import { HeroInMemDataService } from './hero-in-mem-data.service';
import { HeroInMemDataOverrideService } from './hero-in-mem-data-override.service';
import { HereServiceCoreSpec } from './hero-service-core.spec';

import { InMemoryWebApiModule } from '../in-mem/in-memory-web-api.module';

describe('Http: in-mem-data.service', () => {

  const delay = 1; // some minimal simulated latency delay

  describe('raw Angular Http', () => {

    let http: Http;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [
          HttpModule,
          InMemoryWebApiModule.forRoot(HeroInMemDataService, { delay })
        ]
      });

      http = TestBed.get(Http);
    });

    it('can get heroes', async(() => {
      http.get('app/heroes')
      .map(res => res.json().data as Hero[])
      .subscribe(
        heroes => {
          // console.log(heroes);
          expect(heroes.length).toBeGreaterThan(0, 'should have heroes');
        },
        failure
      );
    }));

    it('can get heroes (w/ a different base path)', async(() => {
      http.get('some-base-path/heroes')
      .map(res => res.json().data as Hero[])
      .subscribe(
        heroes => {
          // console.log(heroes);
          expect(heroes.length).toBeGreaterThan(0, 'should have heroes');
        },
        failure
      );
    }));

    it('should 404 when GET unknown collection', async(() => {
      const url = 'app/unknown-collection';
      http.get(url)
      .subscribe(
        _ => {
          console.log(_);
          fail(`should not have found data for '${url}'`);
        },
        err => {
          expect(err.status).toBe(404, 'should have 404 status');
        }
      );
    }));

    it('should return 1-item array for GET app/heroes/?id=1', async(() => {
      http.get('app/heroes/?id=1')
      .map(res => res.json().data as Hero[])
      .subscribe(
        heroes => {
          expect(heroes.length).toBe(1, 'should find one hero w/id=1');
        },
        failure
      );
    }));

    it('should return 1-item array for GET app/heroes?id=1', async(() => {
      http.get('app/heroes?id=1')
      .map(res => res.json().data as Hero[])
      .subscribe(
        heroes => {
          expect(heroes.length).toBe(1, 'should find one hero w/id=1');
        },
        failure
      );
    }));

    it('should return undefined for GET app/heroes?id=not-found-id', async(() => {
      http.get('app/heroes?id=123456')
      .map(res => res.json().data[0] as Hero)
      .subscribe(
        hero => {
          expect(hero).toBeUndefined();
        },
        failure
      );
    }));

    it('should return 404 for GET app/heroes/not-found-id', async(() => {
      const url = 'app/heroes/123456';
      http.get(url)
      .subscribe(
        _ => {
          console.log(_);
          fail(`should not have found data for '${url}'`);
        },
        err => {
          expect(err.status).toBe(404, 'should have 404 status');
        }
      );
    }));

    it('can get nobodies (empty collection)', async(() => {
      http.get('app/nobodies')
      .map(res => res.json().data)
      .subscribe(
        nobodies => {
          expect(nobodies.length).toBe(0, 'should have no nobodies');
        },
        failure
      );
    }));

    it('can add to nobodies (empty collection)', async(() => {
      http.post('app/nobodies', { id: 42, name: 'Noman' })
      .switchMap(() => http.get('app/nobodies'))
      .map(res => res.json().data)
      .subscribe(
        nobodies => {
          expect(nobodies.length).toBe(1, 'should a nobody');
          expect(nobodies[0].name).toBe('Noman', 'should be "Noman"');
          expect(nobodies[0].id).toBe(42, 'should preserve the submitted id');
        },
        failure
      );
    }));

    it('can reset the database to empty', async(() => {
      // Add a nobody so that we have one
      http.post('app/nobodies', { id: 42, name: 'Noman' })
      .switchMap(
        // Reset database with "clear" option
        () => http.post('commands/resetDb', { clear: true })
        // then count the collections
        .switchMap(() => http.get('app/heroes'))
        .zip(
          http.get('app/nobodies'),
          (h, n) => ({
            heroes:   h.json().data.length,
            nobodies: n.json().data.length
          })
        )
      )
      .subscribe(
        sizes => {
          expect(sizes.nobodies).toBe(0, 'reset should have cleared the nobodies');
          expect(sizes.heroes).toBe(0, 'reset should have cleared the heroes');
        },
        failure
      );
    }));
  });

  ////////////////
  describe('raw Angular Http w/ override service', () => {

    let http: Http;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [
          HttpModule,
          InMemoryWebApiModule.forRoot(HeroInMemDataOverrideService, { delay })
        ]
      });

      http = TestBed.get(Http);
    });

    it('can get heroes', async(() => {
      http.get('app/heroes')
      .map(res => res.json().data as Hero[])
      .subscribe(
        heroes => {
          // console.log(heroes);
          expect(heroes.length).toBeGreaterThan(0, 'should have heroes');
        },
        failure
      );
    }));

    it('can get villains', async(() => {
      http.get('app/villains')
      .map(res => res.json().data as Hero[])
      .subscribe(
        villains => {
          // console.log(villains);
          expect(villains.length).toBeGreaterThan(0, 'should have villains');
        },
        failure
      );
    }));

    it('should 404 when POST to villains', async(() => {
      const url = 'app/villains';
      http.post(url, {id: 42, name: 'Dr. Evil'})
      .subscribe(
        _ => {
          console.log(_);
          fail(`should not have POSTed data for '${url}'`);
        },
        err => {
          expect(err.status).toBe(404, 'should have 404 status');
        }
      );
    }));
    it('should 404 when GET unknown collection', async(() => {
      const url = 'app/unknown-collection';
      http.get(url)
      .subscribe(
        _ => {
          console.log(_);
          fail(`should not have found data for '${url}'`);
        },
        err => {
          expect(err.status).toBe(404, 'should have 404 status');
        }
      );
    }));

    it('can add new hero, "Maxinius", using genId override', async(() => {
      http.post('app/heroes', { name: 'Maxinius' })
      .switchMap(() => http.get('app/heroes?name=Maxi'))
      .map(res => res.json().data)
      .subscribe(
        heroes => {
          expect(heroes.length).toBe(1, 'should have found "Maxinius"');
          expect(heroes[0].name).toBe('Maxinius');
          expect(heroes[0].id).toBeGreaterThan(1000);
        },
        failure
      );
    }));

    it('can reset the database to empty', async(() => {
      // Add a nobody so that we have one
      http.post('app/nobodies', { id: 42, name: 'Noman' })
      .switchMap(
        // Reset database with "clear" option
        () => http.post('commands/resetDb', { clear: true })
        // then count the collections
        .switchMap(() => http.get('app/heroes'))
        .zip(
          http.get('app/nobodies'),
          http.get('app/villains'),
          (h, n, v) => ({
            heroes:   h.json().data.length,
            nobodies: n.json().data.length,
            villains: v.json().data.length
          })
        )
      )
      .subscribe(
        sizes => {
          expect(sizes.heroes).toBe(0, 'reset should have cleared the heroes');
          expect(sizes.nobodies).toBe(0, 'reset should have cleared the nobodies');
          expect(sizes.villains).toBeGreaterThan(0, 'reset should have NOT clear villains');
        },
        failure
      );
    }));
  });

  ////////////////

  describe('Http HeroService', () => {

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [
          HttpModule,
          InMemoryWebApiModule.forRoot(HeroInMemDataService, { delay })
        ],
        providers: [
          { provide: HeroService, useClass: HttpHeroService }
        ]
      });

    });

    new HereServiceCoreSpec().run();
  });

  ////////////////
  describe('Http passThru (TODO)', () => {
    // Todo: test passthru.
    // probably have to let Jasmine intercept the Http call
    // because Http's own testing support leans on the backend that we're replacing.

    it('should pass request for unknown collection thru to the "real" backend');
  });
});
