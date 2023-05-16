locals {
  tags = {
    Name : "${var.stack_name}-efs"
  }
}
resource "aws_efs_file_system" "eks_filesystem" {
  creation_token   = "${var.stack_name}-eks"
  performance_mode = "generalPurpose"
  throughput_mode  = "bursting"
  encrypted        = true
  tags             = merge(var.tags, local.tags)
}

# List in local subnets and set for zones
locals {
  private_subnets_list = tolist(module.vpc.private_subnets)
}

resource "aws_efs_mount_target" "zone_a" {
  file_system_id  = aws_efs_file_system.eks_filesystem.id
  subnet_id       = element(local.private_subnets_list, 0)
  security_groups = [module.eks_blueprints.cluster_primary_security_group_id]
}

resource "aws_efs_mount_target" "zone_b" {
  file_system_id  = aws_efs_file_system.eks_filesystem.id
  subnet_id       = element(local.private_subnets_list, 1)
  security_groups = [module.eks_blueprints.cluster_primary_security_group_id]
}

resource "kubernetes_storage_class_v1" "efs" {
  metadata {
    name = "${var.stack_name}-efs"
  }

  storage_provisioner = "efs.csi.aws.com"

  parameters = {
    provisioningMode = "efs-ap"
    fileSystemId     = aws_efs_file_system.eks_filesystem.id
    directoryPerms   = "700"
  }

  mount_options = ["iam"]
  depends_on    = [module.kubernetes_addons]
}
