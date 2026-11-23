// Settings for the temporary explore bar and dock. Copy next to explore-slot.jsx and fill in.
// port 0 means no listener: the bar only switches between drafts and opens the phone preview,
// and the user answers in chat. The dock needs a listener.
export const exploreConfig = {
  port: 0,
  token: "",
  // Write these in the user's language.
  labels: {
    current: "current",
    mixed: "mixed",
    mobile: "Phone view",
    close: "Close",
    remove: "Remove",
    note: "optional note",
    more: "New variations",
    pick: "Pick element",
    picking: "Click an element (Esc cancels)",
    save: "Save",
    library: "My library",
    apply: "Apply",
    confirm: "Click again to apply",
    sent: "Sent, working…",
    offline: "Buttons are off: answer in chat",
  },
};
