"use client";

import AnchorRightIcon from "@assets/icons/anchor-right-icon.svg";
import CameraIcon from "@assets/icons/camera-icon.svg";
import CheckboxCheckIcon from "@assets/icons/checkbox-check-icon.svg";
import UncheckedIcon from "@assets/icons/unchecked-icon.svg";
import { LabeledAutocompleteField } from "@/components/form/LabeledAutocompleteField";
import { LabeledTextField } from "@/components/form/LabeledTextField";
import Avatar from "@/components/genericComponents/Avatar";
import Button from "@/components/genericComponents/Button";
import { Spinner } from "@/components/genericComponents/EmptyState";
import { AccountTypePicker } from "@/components/onboarding/AccountTypePicker";
import { useToast } from "@/components/providers/ToastProvider";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { queryKeys } from "@/lib/queryKeys";
import { DEFAULT_COUNTRY_CODE, searchCities } from "@/services/locations";
import { updateProfile, uploadAvatar } from "@/services/profile";
import type { AccountType, CurrentUser } from "@/types/types";
import { isValidPhone, sanitizePhoneInput } from "@/utils/phone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Web port of flatswipe/src/app/(protected)/(tabs)/editProfile.tsx and
 * EditProfileFields: same fields, same validation, same writes (updateProfile,
 * uploadAvatar — the photo is resized in the browser first, like on the phone).
 *
 * Below lg it is the app's single card. From lg the same card spans the page,
 * split into sections, with the photo and profile type side by side.
 */
export function EditProfileForm() {
  const { currentUser, isLoadingProfile } = useCurrentUser();

  if (isLoadingProfile || !currentUser) {
    return <Spinner className="py-24" />;
  }

  // Keyed so the form re-seeds if the profile is replaced underneath it.
  return <EditProfileFields key={currentUser.id} currentUser={currentUser} />;
}

function EditProfileFields({ currentUser }: { currentUser: CurrentUser }) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bioId = useId();

  const [username, setUsername] = useState(currentUser.username ?? "");
  const [fullName, setFullName] = useState(currentUser.fullName ?? "");
  const [bio, setBio] = useState(currentUser.bio ?? "");
  const [phone, setPhone] = useState(currentUser.phone ?? "");
  const [phonePublic, setPhonePublic] = useState(currentUser.phonePublic ?? false);
  const [city, setCity] = useState(currentUser.city ?? "");
  const [agencyName, setAgencyName] = useState(currentUser.agencyName ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(currentUser.websiteUrl ?? "");
  const [instagramUrl, setInstagramUrl] = useState(currentUser.instagramUrl ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState(currentUser.youtubeUrl ?? "");
  const [accountType, setAccountType] = useState<AccountType>(currentUser.accountType ?? "buyer");
  // A picked file is previewed from a blob: URL and only uploaded on save.
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isDraggingPhoto, setDraggingPhoto] = useState(false);

  useEffect(() => () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.replace("/profile");
  };

  const { mutateAsync: saveProfile, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      let nextAvatarUrl = currentUser.avatarUrl ?? null;
      if (avatarPreview) {
        nextAvatarUrl = await uploadAvatar(currentUser.id, avatarPreview);
      }
      return updateProfile(currentUser.id, {
        username: username.trim(),
        fullName: fullName.trim(),
        bio: bio.trim(),
        phone: phone.trim(),
        phonePublic,
        city: city.trim(),
        agencyName: agencyName.trim(),
        websiteUrl: websiteUrl.trim(),
        instagramUrl: instagramUrl.trim(),
        youtubeUrl: youtubeUrl.trim(),
        avatarUrl: nextAvatarUrl,
        accountType,
      });
    },
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile(updated.id) });
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
      goBack();
    },
  });

  const handleSave = async (event?: React.FormEvent) => {
    event?.preventDefault();

    if (!username.trim()) {
      showToast({ type: "error", message: t("profile.usernameRequired") });
      return;
    }

    if (!isValidPhone(phone)) {
      setPhoneError(t("profile.phoneInvalid"));
      showToast({ type: "error", message: t("profile.phoneInvalid") });
      return;
    }

    setPhoneError(null);

    try {
      await saveProfile();
      showToast({ type: "success", message: t("profile.saveSuccess") });
    } catch (error) {
      console.log("Failed to save profile", error);
      showToast({ type: "error", message: t("profile.saveFailed") });
    }
  };

  const handleFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setAvatarPreview(URL.createObjectURL(file));
  };

  // Ctrl/⌘+S saves, the way it does in any desktop editor.
  const saveRef = useRef(handleSave);
  saveRef.current = handleSave;
  const isSavingRef = useRef(isSaving);
  isSavingRef.current = isSaving;
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (!isSavingRef.current) void saveRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const saveLabel = isSaving ? t("profile.savingProfile") : t("profile.saveProfile");

  return (
    <form onSubmit={handleSave} className="mx-auto w-full max-w-page px-4 pb-16 pt-4 md:px-8 md:pt-8">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={goBack}
          aria-label={t("web.listing.back")}
          className="flex h-10 w-10 items-center justify-center rounded-full text-text hover:bg-surface"
        >
          <AnchorRightIcon width={16} height={16} className="rotate-180" aria-hidden />
        </button>
        <h1 className="flex-1 font-display text-2xl text-text">{t("profile.editProfile")}</h1>
        <Button type="submit" title={saveLabel} disabled={isSaving} className="hidden min-w-0 md:inline-flex" />
      </div>

      <div className="rounded-[32px] bg-surface p-5 md:p-8 lg:px-10 lg:py-9">
        {/* Who you are at a glance: the photo, and the type that shapes the rest of the form. */}
        <div className="lg:grid lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start lg:gap-10">
          <div className="mb-8 flex flex-col items-center gap-2 lg:mb-0 lg:w-[140px]">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDraggingPhoto(true);
              }}
              onDragLeave={() => setDraggingPhoto(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDraggingPhoto(false);
                handleFile(event.dataTransfer.files?.[0]);
              }}
              className={cn(
                "group relative h-[120px] w-[120px] overflow-hidden rounded-full border-4 border-primary",
                isDraggingPhoto && "ring-4 ring-primary-soft ring-offset-2",
              )}
              aria-label={t("profile.changePhoto")}
            >
              <Avatar userId={currentUser.id} avatarUrl={avatarPreview ?? currentUser.avatarUrl} />
              <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-white transition-colors group-hover:bg-black/50">
                <CameraIcon width={30} height={30} aria-hidden />
              </span>
            </button>
            <span className="text-sm font-semibold text-primary">{t("profile.changePhoto")}</span>
            <span className="hidden text-center text-xs leading-4 text-text-muted lg:block">
              {t("web.editProfile.photoHint")}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
          </div>

          {/* First, because it decides what the rest of the app looks like —
              and whether the agency field below is there at all. */}
          <div>
            <p className="mb-2 text-sm font-light text-form-label">{t("profile.accountTypeLabel")}</p>
            <AccountTypePicker value={accountType} onChange={setAccountType} compact />
            <p className="mb-6 mt-2 px-1 text-xs font-light leading-[17px] text-text-muted lg:mb-0">
              {t(`profile.accountTypeHint.${accountType}`)}
            </p>
          </div>
        </div>

        <SectionHeading title={t("web.editProfile.about")} />
        {/* Email, username and full name share one row on desktop. */}
        <div className="grid gap-x-4 md:grid-cols-2 lg:grid-cols-3">
          <LabeledTextField label={t("profile.emailLabel")} value={currentUser.email ?? ""} disabled readOnly />
          <LabeledTextField
            label={t("profile.usernameLabel")}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            spellCheck={false}
            disabled={isSaving}
            placeholder={t("profile.usernamePlaceholder")}
          />
          <div className="md:col-span-2 lg:col-span-1">
            <LabeledTextField
              label={t("profile.fullNameLabel")}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              disabled={isSaving}
              placeholder={t("profile.fullNamePlaceholder")}
            />
          </div>
        </div>

        <div className="mb-[15px]">
          <label htmlFor={bioId} className="mb-1.5 block text-sm font-light text-form-label">
            {t("profile.bioLabel")}
          </label>
          <textarea
            id={bioId}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            disabled={isSaving}
            rows={4}
            placeholder={t("profile.bioPlaceholder")}
            className="w-full resize-y rounded-[25px] bg-surface-muted px-[15px] py-[15px] text-base text-text placeholder:text-placeholder focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft"
          />
        </div>

        <SectionHeading title={t("web.editProfile.contact")} />
        <p className="mb-4 px-1 text-xs font-light leading-[17px] text-text-muted lg:-mt-2 lg:mb-5 lg:px-0 lg:text-sm lg:leading-5">
          {t("profile.contactVisibilityHint")}
        </p>

        <div className="grid gap-x-4 md:grid-cols-2">
          <div>
            <LabeledTextField
              label={t("profile.phoneLabel")}
              value={phone}
              onChangeText={(value) => {
                const sanitized = sanitizePhoneInput(value);
                setPhone(sanitized);
                if (phoneError && isValidPhone(sanitized)) setPhoneError(null);
              }}
              type="tel"
              autoComplete="tel"
              disabled={isSaving}
              placeholder={t("profile.phonePlaceholder")}
              hint={phoneError ?? undefined}
              aria-invalid={!!phoneError || undefined}
            />
            <button
              type="button"
              role="checkbox"
              aria-checked={phonePublic}
              onClick={() => setPhonePublic((value) => !value)}
              disabled={isSaving}
              className="-mt-1.5 mb-4 flex items-start gap-2.5 px-1 text-left"
            >
              {phonePublic ? (
                <CheckboxCheckIcon width={22} height={22} className="shrink-0 text-primary" aria-hidden />
              ) : (
                <UncheckedIcon width={22} height={22} className="shrink-0 text-placeholder" aria-hidden />
              )}
              <span className="flex flex-col">
                <span className="text-sm text-text">{t("profile.phonePublicLabel")}</span>
                <span className="text-xs font-light text-text-muted">
                  {phonePublic ? t("profile.phonePublicOnHint") : t("profile.phonePublicOffHint")}
                </span>
              </span>
            </button>
          </div>
          <LabeledAutocompleteField
            label={t("profile.cityLabel")}
            placeholder={t("profile.cityPlaceholder")}
            value={city}
            onChangeText={setCity}
            fetchSuggestions={(query) => searchCities(query)}
            queryKey={(query) => queryKeys.citySearch(DEFAULT_COUNTRY_CODE, query)}
            getItemLabel={(suggestion) => suggestion.city}
            editable={!isSaving}
          />
        </div>

        <SectionHeading
          title={accountType === "seller" ? t("web.editProfile.agencyAndLinks") : t("web.editProfile.links")}
        />
        <div className="grid gap-x-4 md:grid-cols-2">
          {/* Only meaningful for someone offering a place. Hiding it does not
              clear the value — switching back keeps it. */}
          {accountType === "seller" ? (
            <LabeledTextField
              label={t("profile.agencyNameLabel")}
              value={agencyName}
              onChangeText={setAgencyName}
              disabled={isSaving}
              placeholder={t("profile.agencyNamePlaceholder")}
            />
          ) : null}
          <LabeledTextField
            label={t("profile.websiteLabel")}
            value={websiteUrl}
            onChangeText={setWebsiteUrl}
            type="url"
            autoCapitalize="none"
            disabled={isSaving}
            placeholder={t("profile.websitePlaceholder")}
          />
          <LabeledTextField
            label={t("profile.instagramLabel")}
            value={instagramUrl}
            onChangeText={setInstagramUrl}
            type="url"
            autoCapitalize="none"
            disabled={isSaving}
            placeholder={t("profile.instagramPlaceholder")}
          />
          <LabeledTextField
            label={t("profile.youtubeLabel")}
            value={youtubeUrl}
            onChangeText={setYoutubeUrl}
            type="url"
            autoCapitalize="none"
            disabled={isSaving}
            placeholder={t("profile.youtubePlaceholder")}
          />
        </div>

        {/* Phones: full width at the end. Desktop: at the end of a long form too,
            so nobody scrolls back up to save. Tablets keep only the header button. */}
        <Button
          type="submit"
          title={saveLabel}
          disabled={isSaving}
          fullWidth
          className="mt-4 md:hidden lg:mt-6 lg:ml-auto lg:flex lg:w-auto"
          aria-keyshortcuts="Control+S Meta+S"
        />
      </div>
    </form>
  );
}

/** A section of the form — desktop only; phones keep the uninterrupted card. */
function SectionHeading({ title }: { title: string }) {
  return (
    <h2 className="mb-4 mt-9 hidden border-t border-border pt-8 font-display text-lg text-text lg:block">{title}</h2>
  );
}
