/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { DocLinksStart, CoreSetup } from 'src/core/public';
import { VisualizationsSetup } from '../../visualizations/public';
import { getMapsAliasConfig } from './vis_type_alias';

export interface MapsPluginSetupDependencies {
  visualizations: VisualizationsSetup;
}

export interface MapsPluginStartDependencies {
  docLinks: DocLinksStart;
}

export class MapsOSSPlugin {
  setup(
    core: CoreSetup<MapsPluginStartDependencies>,
    { visualizations }: MapsPluginSetupDependencies
  ) {
    core.getStartServices().then(([coreStart]) => {
      visualizations.registerAlias(getMapsAliasConfig(coreStart.docLinks));
    });
  }

  start() {}
}
