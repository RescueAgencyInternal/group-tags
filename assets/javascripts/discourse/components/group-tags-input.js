// group-tags-input.js

import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { A } from "@ember/array";
import { action } from "@ember/object";
import groupTagOptions from "../lib/group-tag-options";

export default class GroupTagsInputComponent extends Component {
  @tracked allTags = groupTagOptions;
  @tracked primarySector = "";
  @tracked secondaryTags = A([]);
  @tracked showCustomPrimaryInput = false;
  @tracked customPrimaryInputValue = "";
  @tracked showCustomSecondaryInput = false;
  @tracked customSecondaryInputValue = "";
  @tracked selectedSecondaryTag = "";

  constructor() {
    super(...arguments);

    const model = this.args.model || this.args.group;

    // Load primary sector
    this.primarySector =
      model?.custom_fields?.primary_sector?.toString?.().trim() || "";

    // Load secondary sectors
    const raw = model?.custom_fields?.secondary_sectors;
    let parsed = [];

    if (typeof raw === "string") {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = [];
      }
    } else if (Array.isArray(raw)) {
      parsed = raw;
    }

    this.secondaryTags = A(parsed.slice());
  }

  get availableSecondaryTags() {
    return this.allTags.filter(
      (tag) =>
        tag !== this.primarySector &&
        !this.secondaryTags.includes(tag) &&
        tag !== "custom"
    );
  }

  get availablePrimaryTags() {
    let tags = this.allTags.filter(
      (tag) => tag !== "custom" && !this.secondaryTags.includes(tag)
    );

    if (this.primarySector && !tags.includes(this.primarySector)) {
      tags = [...tags, this.primarySector];
    }

    return tags;
  }

  @action
  onPrimaryChange(event) {
    const value = event.target.value;

    if (value === "custom") {
      this.showCustomPrimaryInput = true;
      this.customPrimaryInputValue = "";
    } else {
      this.primarySector = value;
      this.showCustomPrimaryInput = false;
      this._syncCustomFields();
    }
  }

  @action
  onCustomPrimaryInput(event) {
    this.customPrimaryInputValue = event.target.value;
  }

  @action
  onCustomPrimaryInputKeydown(event) {
    if (event.key === "Enter" && this.customPrimaryInputValue.trim()) {
      this.primarySector = this.customPrimaryInputValue.trim();
      this.showCustomPrimaryInput = false;
      this._syncCustomFields();
    }
  }

  @action
  onSecondaryChange(event) {
    const value = event.target.value;

    if (value === "custom") {
      this.showCustomSecondaryInput = true;
      this.customSecondaryInputValue = "";
    } else if (value && !this.secondaryTags.includes(value)) {
      this.secondaryTags = A([...this.secondaryTags, value]);
      this.showCustomSecondaryInput = false;
      this.selectedSecondaryTag = ""; // ✅ reset the select
      this._syncCustomFields();
    }
  }

  @action
  onCustomSecondaryInput(event) {
    this.customSecondaryInputValue = event.target.value;
  }

  @action
  onCustomSecondaryInputKeydown(event) {
    if (event.key === "Enter" && this.customSecondaryInputValue.trim()) {
      const tag = this.customSecondaryInputValue.trim();
      if (!this.secondaryTags.includes(tag)) {
        this.secondaryTags = A([...this.secondaryTags, tag]);
        this._syncCustomFields();
      }
      this.customSecondaryInputValue = "";
      this.showCustomSecondaryInput = false;
    }
  }

  @action
  removeSecondaryTag(tag) {
    const filtered = this.secondaryTags.filter((t) => t !== tag);
    this.secondaryTags = A(filtered);
    this._syncCustomFields();
  }

  _syncCustomFields() {
    const model = this.args.model || this.args.group;

    const secondary = JSON.stringify(this.secondaryTags ?? []);

    if (typeof model.setCustomFields === "function") {
      model.setCustomFields({
        primary_sector: this.primarySector,
        secondary_sectors: secondary,
      });
    } else {
      if (!model.custom_fields) {
        model.custom_fields = {};
      }
      model.custom_fields.primary_sector = this.primarySector;
      model.custom_fields.secondary_sectors = secondary;
    }
  }
}
