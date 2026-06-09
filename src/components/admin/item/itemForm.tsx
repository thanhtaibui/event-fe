import { useEffect, useState } from "react";
import { PosterUpload } from "../layout/Upload";
import type { ItemModalType } from "./itemModal";
import { useCreateItem } from "../../../hooks/admin/item/useCreateItem";
import type { ItemPayload } from "../../../types/item/payload";
import { toast } from "react-toastify";
import { useUpload } from "../../../hooks/admin/useUpload";
import { useUpdateItem } from "../../../hooks/admin/item/useUpdateItem";

export type ItemFormProps = {
  type: ItemModalType;
  item?: any;
  onSuccess?: () => void;
  onCreateMode?: () => void;
  id: string;
};

export default function ItemForm({
  type,
  onSuccess,
  item,
  onCreateMode,
  id,
}: ItemFormProps) {
  const [poster, setPoster] = useState<File | null>(null);
  const { createItem } = useCreateItem();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [posterUrl, setPosterUrl] = useState<string>("");
  // NOTE: keep Ui loading state removed to satisfy TS6133 (unused)
  // const [uiLoading, setUiLoading] = useState(false);

  const { upload } = useUpload();
  const { updateItem } = useUpdateItem();
  useEffect(() => {
    if (type === "update" && item) {
      setName(item.name || "");
      setPrice(String(item.price || ""));
      // console.log("Item imageUrl:", item.imageUrl);
      setPoster(null);
      setPosterUrl(item.imageUrl || "");
    }

    if (type === "create") {
      setName("");
      setPrice("");
      setPoster(null);
      setPosterUrl("");
    }
  }, [type, item]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("poster before submit:", posterUrl, poster);

    if (!posterUrl && !poster) {
      toast.warning("Image Item is required");
      return;
    }
    if (!name.trim()) {
      toast.warn("Name is required");
      return;
    }

    if (!price) {
      toast.warn("Price is required");
      return;
    }

    // setUiLoading(true);

    try {
      const formData = new FormData();
      let posterUrlFinal = posterUrl;

      if (poster) {
        formData.append("file", poster);
        formData.append("folder", "item-img");
        await toast.promise(
          upload(formData).then((res) => {
            posterUrlFinal = res.secure_url;
          }),
          {
            pending: "Uploading image...",
            success: "Image uploaded!",
            error: "Failed to upload Image",
          },
        );
      }
      formData.append("name", name);
      formData.append("price", price);
      const payload: ItemPayload = {
        name: formData.get("name") as string,
        price: Number(formData.get("price")),
        eventId: id as string,
        imageUrl: posterUrlFinal,
      };
      if (type === "update" && item) {
        const success = await updateItem(item.id, payload);
        if (success) {
          await onSuccess?.();
          toast.success("Update Item Successfully");
        }
      } else {
        const success = await createItem(payload);
        if (success) {
          setName("");
          setPrice("");
          setPoster(null);
          await onSuccess?.();
          toast.success("Create Item Successfully");
        }
      }
    } catch (error) {
      // handled by toast.promise
    } finally {
      // setUiLoading(false);
    }
  };

  return (
    <form className="inventory-form" onSubmit={handleSubmit}>
      <div className="inventory-form__header">
        <h3 className="inventory-form__title">
          {type === "create" ? "Create Item" : "Update Item"}
        </h3>

        <div className="inventory-form__subtitle">
          {type === "update"
            ? `Editing: ${item.name}`
            : "Create new inventory item"}
        </div>
      </div>

      <div className="inventory-form__body">
        <div className="inventory-form__upload">
          <PosterUpload
            value={poster}
            defaultUrl={posterUrl}
            onChange={setPoster}
            onRemove={() => {
              setPosterUrl("");
            }}
          />
        </div>

        <div className="inventory-form__group">
          <label className="inventory-form__label">Name</label>

          <input
            className="inventory-form__input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Conference T-Shirt"
          />
        </div>

        <div className="inventory-form__group">
          <label className="inventory-form__label">Price</label>

          <div className="inventory-form__input-wrapper">
            <input
              className="inventory-form__input"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 135000"
            />

            <span className="inventory-form__suffix">VNĐ</span>
          </div>
        </div>
      </div>

      <div className="inventory-form__footer">
        {type === "update" && (
          <button
            type="button"
            className="inventory-form__cancel"
            onClick={onCreateMode}
          >
            Go Back
          </button>
        )}

        <button type="submit" className="inventory-form__submit">
          Save
        </button>
      </div>
    </form>
  );
}
