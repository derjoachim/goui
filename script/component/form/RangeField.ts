/**
 * @license https://github.com/Intermesh/goui/blob/main/LICENSE MIT License
 * @copyright Copyright 2023 Intermesh BV
 * @author Joachim van de Haterd <jhaterd@intermesh.nl>
 */

import {createComponent} from "../Component.js";
import {Config} from "../Observable";
import {FieldEventMap} from "./Field";
import {NumberField} from "./NumberField";

export class RangeField extends NumberField {

	protected baseCls = 'goui-form-field range no-floating-label';
	constructor() {
		super();
		this.type = "range";

		// set the navigator defaults
		this.value = 50;
		this.min = 0;
		this.max = 100;
	}
}

export const rangefield = (config?: Config<RangeField, FieldEventMap<RangeField>>) => createComponent(new RangeField(), config);