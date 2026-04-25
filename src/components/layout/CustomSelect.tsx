const ICONS = {
  org: "https://img.icons8.com/nolan/64/organization.png",
  role: "https://img.icons8.com/nolan/64/user-shield.png",
};
export const CustomOption = (props: any) => {
  const { data, isSelected, isFocused, innerRef, innerProps } = props;
  const iconUrl = data.type === "role" ? ICONS.role : ICONS.org;
  return (
    <div
      ref={innerRef}
      {...innerProps}
      className={`custom-option ${isSelected ? "is-selected" : ""} ${isFocused ? "is-focused" : ""}`}
    >
      <div className="option-left-content">
        <img
          width="20"
          height="20"
          src={iconUrl}
          alt="icon"
          className="select-icon"
        />
        <span className="select-label" title={data.label}>
          {data.label}
        </span>
      </div>
      {isSelected && (
        <span className="option-icon">
          <img
            width="30"
            height="30"
            src="https://img.icons8.com/ios-glyphs/30/checkmark--v1.png"
            alt="checkmark--v1"
          />
        </span>
      )}
    </div>
  );
};
export const CustomSingleValue = (props: any) => {
  const { data, children, ...rest } = props;
  const iconUrl = data.type === "role" ? ICONS.role : ICONS.org;
  return (
    <div className="custom-single-value">
      <img width="20" height="20" src={iconUrl} alt="icon" />
      <span title={children}>{children}</span>
    </div>
  );
};
