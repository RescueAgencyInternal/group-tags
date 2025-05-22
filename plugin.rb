# name: group-tags
# about: Adds primary and secondary sector tags to groups via custom_fields
# version: 0.2
# authors: Rescue Agency
# url: https://github.com/RescueAgencyInternal/group-tags

register_asset "stylesheets/common/group-tags.scss"
register_asset "stylesheets/common/group-index-box-after.scss"

after_initialize do
  # normalize and store secondary sectors as JSON string
  Group.class_eval do
    before_save do
      secondary = self.custom_fields["secondary_sectors"]
      if secondary.is_a?(Array)
        normalized = secondary.map { |t| t.strip.downcase }.uniq
        self.custom_fields["secondary_sectors"] = normalized.to_json
      end
    end
  end

  # expose primary_sector directly
  add_to_serializer(:group_show, :primary_sector) do
    object.custom_fields["primary_sector"]
  end

  add_to_serializer(:group_show, :include_primary_sector?) do
    object.custom_fields["primary_sector"].present?
  end

  add_to_serializer(:group_show, :custom_fields) { object.custom_fields }

  # deserialize secondary_sectors from JSON
  add_to_serializer(:group_show, :secondary_sectors) do
    raw = object.custom_fields["secondary_sectors"]
    begin
      JSON.parse(raw)
    rescue
      []
    end
  end

  add_to_serializer(:basic_group, :custom_fields) { object.custom_fields }

  add_to_serializer(:group_show, :include_secondary_sectors?) do
    object.custom_fields["secondary_sectors"].present?
  end

  # allow both fields to be edited from the admin UI
  register_editable_group_custom_field :primary_sector
  register_editable_group_custom_field :secondary_sectors
end
