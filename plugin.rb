# name: group-tags
# about: Adds custom tags to groups and stores them as a serialized string in group_custom_fields
# version: 0.1
# authors: You

register_asset "stylesheets/common/group-tags.scss"

after_initialize do
  # Store as JSON string before saving
  Group.class_eval do
    before_save do
      tags = self.custom_fields["group_custom_tags"]

      if tags.is_a?(Array)
        self.custom_fields["group_custom_tags"] = tags.to_json
      end
    end
  end

  # Deserialize tags when presenting in serializer (optional, but useful)
  add_to_serializer(:group_show, :group_custom_tags) do
    raw = object.custom_fields["group_custom_tags"]
    begin
      JSON.parse(raw)
    rescue
      []
    end
  end

  add_to_serializer(:group_show, :include_group_custom_tags?) do
    object.custom_fields["group_custom_tags"].present?
  end

  # Permit custom_fields in the group form
  register_editable_group_custom_field :group_custom_tags
end
