from PIL import Image, ImageOps

SUPPORTED_FILTERS = [
    "grayscale",
]


# PUBLIC_INTERFACE
def process_image(input_path, output_path, filter_name):
    """
    Apply a filter/transform to an image and save the result.

    Args:
        input_path (str): Path to input image.
        output_path (str): Where to save output image.
        filter_name (str): The filter to apply.

    Raises:
        ValueError: If the given filter is not supported.
    """
    if filter_name not in SUPPORTED_FILTERS:
        raise ValueError(f"Unsupported filter: {filter_name}")
    img = Image.open(input_path)
    if filter_name == "grayscale":
        img = ImageOps.grayscale(img)
    img.save(output_path)
