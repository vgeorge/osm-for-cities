
module "eks_blueprints" {
  source             = "github.com/aws-ia/terraform-aws-eks-blueprints?ref=v4.25.0"
  cluster_name       = "${var.stack_name}-cluster"
  cluster_version    = "1.25"
  enable_irsa        = true
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnets

  managed_node_groups = {
    web_nodes = {
      capacity_type   = "ON_DEMAND"
      node_group_name = "nodes-${var.stack_name}-web"
      instance_types  = ["t2.small"]
      desired_size    = "1"
      max_size        = "2"
      min_size        = "1",
      k8s_labels = {
        nodegroup_type = "web"
      },
      additional_tags = {
        Name = "${var.stack_name}-web"
      }
    },
    data_processing_nodes = {
      capacity_type   = "ON_DEMAND"
      node_group_name = "nodes-${var.stack_name}-data-processing"
      instance_types  = ["t3.small"]
      desired_size    = "1"
      max_size        = "2"
      min_size        = "1",
      k8s_labels = {
        nodegroup_type = "data_processing"
      },
      additional_tags = {
        Name = "${var.stack_name}-data_processing"
      }
    }
  }

  tags = var.tags
}
