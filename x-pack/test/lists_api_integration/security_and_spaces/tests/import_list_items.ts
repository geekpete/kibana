/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import expect from '@kbn/expect';
import { ListItemSchema } from '../../../../plugins/lists/common/schemas';
import { getListItemResponseMockWithoutAutoGeneratedValues } from '../../../../plugins/lists/common/schemas/response/list_item_schema.mock';
import { ListSchema } from '../../../../plugins/lists/common';
import { getListResponseMockWithoutAutoGeneratedValues } from '../../../../plugins/lists/common/schemas/response/list_schema.mock';
import { FtrProviderContext } from '../../common/ftr_provider_context';

import { LIST_ITEM_URL } from '../../../../plugins/lists/common/constants';

import {
  createListsIndex,
  deleteListsIndex,
  removeListServerGeneratedProperties,
  removeListItemServerGeneratedProperties,
  waitFor,
} from '../../utils';

import { getImportListItemAsBuffer } from '../../../../plugins/lists/common/schemas/request/import_list_item_schema.mock';

// eslint-disable-next-line import/no-default-export
export default ({ getService }: FtrProviderContext): void => {
  const supertest = getService('supertest');

  describe('import_list_items', () => {
    describe('importing list items without an index', () => {
      it('should not import a list item if the index does not exist yet', async () => {
        const { body } = await supertest
          .post(`${LIST_ITEM_URL}/_import?type=ip`)
          .set('kbn-xsrf', 'true')
          .attach('file', getImportListItemAsBuffer(['127.0.0.1', '127.0.0.2']), 'list_items.txt')
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(400);

        expect(body).to.eql({
          status_code: 400,
          message:
            'To import a list item, the index must exist first. Index ".lists-default" does not exist',
        });
      });
    });

    describe('importing lists with an index', () => {
      beforeEach(async () => {
        await createListsIndex(supertest);
      });

      afterEach(async () => {
        await deleteListsIndex(supertest);
      });

      it('should set the response content types to be expected when importing two items', async () => {
        await supertest
          .post(`${LIST_ITEM_URL}/_import?type=ip`)
          .set('kbn-xsrf', 'true')
          .attach('file', getImportListItemAsBuffer(['127.0.0.1', '127.0.0.2']), 'list_items.txt')
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(200);
      });

      it('should report that it imported a simple list successfully', async () => {
        const { body } = await supertest
          .post(`${LIST_ITEM_URL}/_import?type=ip`)
          .set('kbn-xsrf', 'true')
          .attach('file', getImportListItemAsBuffer(['127.0.0.1', '127.0.0.2']), 'list_items.txt')
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(200);

        const bodyToCompare = removeListServerGeneratedProperties(body);
        const outputtedList: Partial<ListSchema> = {
          ...getListResponseMockWithoutAutoGeneratedValues(),
          name: 'list_items.txt',
          description: 'File uploaded from file system of list_items.txt',
        };
        expect(bodyToCompare).to.eql(outputtedList);
      });

      it('should be able to read imported list items back out correctly', async () => {
        await supertest
          .post(`${LIST_ITEM_URL}/_import?type=ip`)
          .set('kbn-xsrf', 'true')
          .attach('file', getImportListItemAsBuffer(['127.0.0.1', '127.0.0.2']), 'list_items.txt')
          .expect(200);

        // Although we try to be aggressive with waitFor in the lists code base, there is still not guarantees
        // that we will have the data just yet so we have to do a waitFor here for when it shows up
        await waitFor(async () => {
          const { status } = await supertest
            .get(`${LIST_ITEM_URL}?list_id=list_items.txt&value=127.0.0.1`)
            .send();
          return status !== 404;
        });
        const { body } = await supertest
          .get(`${LIST_ITEM_URL}?list_id=list_items.txt&value=127.0.0.1`)
          .send()
          .expect(200);

        const bodyToCompare = removeListItemServerGeneratedProperties(body[0]);
        const outputtedList: Partial<ListItemSchema> = {
          ...getListItemResponseMockWithoutAutoGeneratedValues(),
          list_id: 'list_items.txt',
        };
        expect(bodyToCompare).to.eql(outputtedList);
      });
    });
  });
};
