/**
 * Data field that automatically selects the Advancement-specific configuration or value data models.
 *
 * @param {Advancement} advancementType  Advancement class to which this field belongs.
 */
export class AdvancementDataField extends foundry.data.fields.ObjectField {
  constructor(advancementType, options={}) {
    super(options);
    this.advancementType = advancementType;
  }

  /** @inheritdoc */
  static get _defaults() {
    return foundry.utils.mergeObject(super._defaults, {required: true});
  }

  getModel() {
    return this.advancementType.metadata?.dataModels?.[this.name];
  }

  getDefaults() {
    return this.advancementType.metadata?.defaults?.[this.name] ?? {};
  }

  _cleanType(value, options) {
    if ( !(typeof value === "object") ) value = {};

    // Use a defined DataModel
    const cls = this.getModel();
    if ( cls ) return cls.cleanData(value, options);
    if ( options.partial ) return value;

    // Use the defined defaults
    const defaults = this.getDefaults();
    return foundry.utils.mergeObject(defaults, value);
  }

  initialize(value, model) {
    const cls = this.getModel();
    if ( cls ) return new cls(value, {parent: model});
    return foundry.utils.deepClone(value);
  }
}

/* -------------------------------------------- */

/**
 * @typedef {StringFieldOptions} FormulaFieldOptions
 * @property {boolean} [deterministic=false]  Is this formula not allowed to have dice values?
 * @property {boolean} [extended=false]       Does this formula support conditional operators (aka max uses field)?
 */

/**
 * Special case StringField which represents a formula.
 *
 * @param {FormulaFieldOptions} [options={}]  Options which configure the behavior of the field.
 * @property {boolean} deterministic=false    Is this formula not allowed to have dice values?
 * @property {boolean} extended=false         Does this formula support conditional operators (aka max uses field)?
 */
export class FormulaField extends foundry.data.fields.StringField {

  /** @inheritdoc */
  static get _defaults() {
    return foundry.utils.mergeObject(super._defaults, {
      deterministic: false,
      extended: false
    });
  }

  /** @inheritdoc */
  _validateType(value) {
    if ( !this.options.extended ) {
      const roll = new Roll(value);
      roll.evaluate({async: false});
      if ( this.deterministic && !roll.isDeterministic ) throw new Error("must not contain dice terms");
    } else {
      const formula = Roll.replaceFormulaData(value, {}, {missing: "0"});
      Roll.safeEval(formula);
    }
    super._validateType(value);
  }

}

/* -------------------------------------------- */

/**
 * Special case StringField that includes automatic validation for identifiers.
 */
export class IdentifierField extends foundry.data.fields.StringField {
  /** @override */
  _validateType(value) {
    if ( !dnd5e.utils.validators.isValidIdentifier(value) ) throw new Error(game.i18n.localize("DND5E.IdentifierError"));
  }
}
