import hashlib

def _hash_string_to_int(s: str) -> int:
    """Hashes a string and returns an integer."""
    # Use SHA-256 for a good distribution
    hash_object = hashlib.sha256(s.encode('utf-8'))
    # Convert the first part of the hash to an integer
    return int(hash_object.hexdigest()[:8], 16)

def _hsl_to_hex(h: int, s: int, l: int) -> str:
    """Converts HSL color values to a HEX string."""
    s /= 100
    l /= 100
    c = (1 - abs(2 * l - 1)) * s
    x = c * (1 - abs((h / 60) % 2 - 1))
    m = l - c / 2
    
    if 0 <= h < 60:
        r, g, b = c, x, 0
    elif 60 <= h < 120:
        r, g, b = x, c, 0
    elif 120 <= h < 180:
        r, g, b = 0, c, x
    elif 180 <= h < 240:
        r, g, b = 0, x, c
    elif 240 <= h < 300:
        r, g, b = x, 0, c
    else: # 300 <= h < 360
        r, g, b = c, 0, x
        
    r, g, b = round((r + m) * 255), round((g + m) * 255), round((b + m) * 255)
    
    return f'#{r:02x}{g:02x}{b:02x}'

def generate_color_from_string(text: str) -> str:
    """
    Generates a deterministic, vibrant, and visually distinct color from a string.

    This works by:
    1. Hashing the input string to get a number.
    2. Using a predefined palette of visually distinct hue values.
    3. Using the hash to pick a hue from the palette.
    4. Combining the hue with fixed high saturation and ideal lightness.
    5. Converting the final HSL color to a HEX string.

    Args:
        text: The input string (e.g., a tag name).

    Returns:
        A HEX color string (e.g., '#ff5733').
    """
    # A palette of 12 visually distinct hues, spaced 30 degrees apart on the color wheel.
    # Started at 15 degrees to avoid pure red, which can be harsh.
    HUE_PALETTE = [15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345]
    
    # Fixed saturation and lightness for vibrant but not jarring colors.
    SATURATION = 70  # 0-100%
    LIGHTNESS = 55   # 0-100%, 50% is pure color, a bit higher avoids looking too dark.

    # 1. Hash the string and get an index
    hash_int = _hash_string_to_int(text)
    palette_index = hash_int % len(HUE_PALETTE)
    
    # 2. Pick the hue from the palette
    hue = HUE_PALETTE[palette_index]
    
    # 3. Convert HSL to HEX
    return _hsl_to_hex(hue, SATURATION, LIGHTNESS)