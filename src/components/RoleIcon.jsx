import { useState } from "react";

const roleAssets = {
  Top: "position-top.svg",
  Jungle: "position-jungle.svg",
  Middle: "position-middle.svg",
  Bottom: "position-bottom.svg",
  Support: "position-utility.svg",
};

const assetRoot = "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/svg/";

export default function RoleIcon({ role }) {
  const [failed, setFailed] = useState(false);
  const asset = roleAssets[role];

  return <span className="role-icon" title={role || "Role"} aria-label={role || "Role"} role="img">
    {asset && !failed ? <img src={assetRoot + asset} alt="" onError={() => setFailed(true)} /> : <span className="role-icon-fallback">?</span>}
  </span>;
}
