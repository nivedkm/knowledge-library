from uuid import UUID


class ResourceNotFoundError(Exception):
    """Raised when a requested application resource does not exist."""

    def __init__(self, resource_name: str, resource_id: UUID) -> None:
        self.resource_name = resource_name
        self.resource_id = resource_id
        super().__init__(f"{resource_name} {resource_id} was not found.")
